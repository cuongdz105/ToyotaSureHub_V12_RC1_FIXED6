// ==========================================
// Thu mua xe — Purchase Lead Service
// Bảng: purchase_leads
// Bucket ảnh (riêng tư): purchase-lead-images
// Edge function: parse-purchase-lead
// ==========================================

import imageCompression from "browser-image-compression";
import { supabase } from "../lib/supabase";

const TABLE = "purchase_leads";
const BUCKET = "purchase-lead-images";

export const LEAD_STATUSES = [
    { value: "new", label: "Chưa gọi", color: "#6b7280" },
    { value: "called", label: "Đã gọi", color: "#2563eb" },
    { value: "negotiating", label: "Đang đàm phán", color: "#d97706" },
    { value: "inspected", label: "Đã xem xe", color: "#7c3aed" },
    { value: "bought", label: "Mua được", color: "#16a34a" },
    { value: "dropped", label: "Bỏ", color: "#9ca3af" },
];

export const SELLER_TYPES = {
    individual: "Xe dân / chính chủ",
    dealer: "Salon / cò",
    unknown: "Chưa rõ",
};

// ---------- tiện ích ----------

export function normalizePhone(raw) {
    let d = String(raw || "").replace(/\D/g, "");
    if (d.startsWith("84") && d.length === 11) d = "0" + d.slice(2);
    if (d.length !== 10 || !/^0[235789]/.test(d)) return "";
    return d;
}

export function formatPhone(raw) {
    const d = normalizePhone(raw);
    if (!d) return raw || "";
    return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
}

// "520tr", "1 tỷ 150", "1ty15", "650.000.000" → số VNĐ
export function parsePrice(input) {
    if (input === null || input === undefined || input === "") return null;
    if (typeof input === "number") return input;
    const s = String(input).toLowerCase().replace(/,/g, ".").replace(/\s+/g, " ").trim();

    const ty = s.match(/(\d+(?:\.\d+)?)\s*(?:tỷ|ty|tỉ|ti)\s*(\d+)?/);
    if (ty) {
        let total = parseFloat(ty[1]) * 1e9;
        if (ty[2]) {
            const rest = ty[2];
            // "1 tỷ 15" = 1.150 tỷ ; "1 tỷ 150" = 1.150 tỷ
            total += parseInt(rest.padEnd(3, "0").slice(0, 3), 10) * 1e6;
        }
        return Math.round(total);
    }
    const tr = s.match(/(\d+(?:\.\d+)?)\s*(?:tr|triệu|trieu|m)\b/);
    if (tr) return Math.round(parseFloat(tr[1]) * 1e6);

    const digits = s.replace(/\D/g, "");
    if (!digits) return null;
    const n = parseInt(digits, 10);
    // gõ "520" hiểu là 520 triệu
    if (n < 100000) return n * 1e6;
    return n;
}

export function formatPrice(vnd) {
    if (!vnd) return "";
    if (vnd >= 1e9) {
        const ty = Math.floor(vnd / 1e9);
        const tr = Math.round((vnd % 1e9) / 1e6);
        return tr ? `${ty} tỷ ${String(tr).padStart(3, "0")}` : `${ty} tỷ`;
    }
    return `${Math.round(vnd / 1e6)} triệu`;
}

export function zaloLink(phone) {
    const d = normalizePhone(phone);
    return d ? `https://zalo.me/${d}` : "";
}

// ---------- AI đọc tin ----------

async function fileToCompressedDataUrl(file) {
    const compressed = await imageCompression(file, {
        maxSizeMB: 0.6,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        fileType: "image/jpeg",
    });
    const dataUrl = await imageCompression.getDataUrlFromFile(compressed);
    return { blob: compressed, dataUrl };
}

/**
 * Đọc 1 tin: truyền { text } hoặc { url } hoặc { file } (ảnh chụp màn hình).
 * Có thể truyền kèm url + file (link FB + ảnh chụp).
 */
export async function parseLead({ text = "", url = "", file = null } = {}) {
    let image = "";
    let blob = null;
    if (file) {
        const r = await fileToCompressedDataUrl(file);
        image = r.dataUrl;
        blob = r.blob;
    }

    const { data, error } = await supabase.functions.invoke("parse-purchase-lead", {
        body: { text, url, image },
    });

    if (error) throw new Error(error.message || "Không đọc được tin.");
    if (data?.error) throw new Error(data.error);

    return { ...data, _imageBlob: blob };
}

// ---------- ảnh ----------

async function uploadScreenshot(blob) {
    const path = `${new Date().toISOString().slice(0, 10)}/${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}.jpg`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
        contentType: "image/jpeg",
        upsert: false,
    });
    if (error) throw error;
    return path;
}

export async function getScreenshotUrl(path) {
    if (!path) return "";
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
    return data?.signedUrl || "";
}

// ---------- CRUD ----------

export async function listLeads({ status = "", search = "" } = {}) {
    let q = supabase.from(TABLE).select("*").order("created_at", { ascending: false }).limit(500);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) throw error;

    const s = search.trim().toLowerCase();
    if (!s) return data || [];
    const sDigits = s.replace(/\D/g, "");
    return (data || []).filter((l) => {
        if (sDigits.length >= 4 && (l.phone_normalized || "").includes(sDigits)) return true;
        return [l.brand, l.model, l.version, l.location, l.seller_name, l.source_name, l.notes]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(s);
    });
}

export async function getLead(id) {
    const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).single();
    if (error) throw error;
    return data;
}

/** Tìm tin đã lưu trùng số điện thoại hoặc trùng link */
export async function findDuplicates({ phone, sourceUrl, excludeId } = {}) {
    const norm = normalizePhone(phone);
    const results = [];
    if (norm) {
        const { data } = await supabase
            .from(TABLE)
            .select("id, brand, model, year, status, created_at, asking_price, source_url")
            .eq("phone_normalized", norm)
            .order("created_at", { ascending: false });
        results.push(...(data || []));
    }
    if (sourceUrl) {
        const { data } = await supabase
            .from(TABLE)
            .select("id, brand, model, year, status, created_at, asking_price, source_url")
            .eq("source_url", sourceUrl);
        for (const r of data || []) if (!results.find((x) => x.id === r.id)) results.push(r);
    }
    return results.filter((r) => r.id !== excludeId);
}

const EDITABLE = [
    "source_type", "source_name", "source_url",
    "seller_name", "phone", "seller_type",
    "brand", "model", "version", "year", "odo_km", "color", "gearbox", "fuel",
    "location", "asking_price", "description",
    "raw_text", "ai_confidence",
    "status", "offered_price", "deal_price", "next_follow_up_at", "notes",
];

function pickRow(lead) {
    const row = {};
    for (const k of EDITABLE) if (lead[k] !== undefined) row[k] = lead[k] === "" ? null : lead[k];
    if (lead.phone !== undefined) row.phone_normalized = normalizePhone(lead.phone) || null;
    for (const k of ["year", "odo_km", "asking_price", "offered_price", "deal_price"]) {
        if (row[k] !== undefined && row[k] !== null) row[k] = Number(row[k]) || null;
    }
    return row;
}

export async function createLead(lead, imageBlob = null) {
    const row = pickRow(lead);
    if (imageBlob) row.screenshot_path = await uploadScreenshot(imageBlob);
    row.contact_log = [{ at: new Date().toISOString(), status: row.status || "new", note: "Thêm tin" }];
    const { data, error } = await supabase.from(TABLE).insert(row).select().single();
    if (error) throw error;
    return data;
}

export async function updateLead(id, patch, { logNote } = {}) {
    const row = pickRow(patch);
    if (logNote !== undefined || patch.status) {
        const current = await getLead(id);
        const log = Array.isArray(current.contact_log) ? current.contact_log : [];
        if (patch.status !== current.status || logNote) {
            log.push({
                at: new Date().toISOString(),
                status: patch.status || current.status,
                note: logNote || "",
            });
            row.contact_log = log;
        }
    }
    const { data, error } = await supabase.from(TABLE).update(row).eq("id", id).select().single();
    if (error) throw error;
    return data;
}

export async function deleteLead(lead) {
    if (lead.screenshot_path) await supabase.storage.from(BUCKET).remove([lead.screenshot_path]);
    const { error } = await supabase.from(TABLE).delete().eq("id", lead.id);
    if (error) throw error;
}
