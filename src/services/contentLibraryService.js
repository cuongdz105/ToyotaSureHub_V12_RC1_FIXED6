// ==========================================
// ToyotaSureHub V11
// Content Library Storage Service — Supabase version
//
// Thay IndexedDB bằng Supabase:
// - content_library         → metadata bài mẫu
// - content_library_images  → ảnh (storage_path, public_url)
// - Storage bucket "content-library-images" → file ảnh thật
// ==========================================
 
import { supabase } from "../lib/supabase";
 
const TABLE = "content_library";
const IMAGES_TABLE = "content_library_images";
const BUCKET = "content-library-images";
 
 
// ==========================================
// HELPER: TẠO TÊN FILE NGẪU NHIÊN
// ==========================================
 
function createFileName() {
    return (
        Date.now() +
        "_" +
        Math.random().toString(36).slice(2, 9) +
        ".jpg"
    );
}
 
 
// ==========================================
// HELPER: UPLOAD 1 ẢNH LÊN STORAGE
// ==========================================
 
async function uploadScreenshot(sampleId, blobOrFile) {
 
    const fileName = createFileName();
    const path = `${sampleId}/${fileName}`;
 
    const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, blobOrFile, {
            contentType: blobOrFile.type || "image/jpeg",
            upsert: false,
        });
 
    if (uploadError) {
        throw uploadError;
    }
 
    const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path);
 
    return {
        storage_path: path,
        public_url: urlData.publicUrl,
    };
}
 
 
// ==========================================
// HELPER: XÓA 1 ẢNH KHỎI STORAGE
// ==========================================
 
async function deleteScreenshotFile(storagePath) {
 
    if (!storagePath) return;
 
    await supabase.storage
        .from(BUCKET)
        .remove([storagePath]);
}
 
 
// ==========================================
// HELPER: LẤY ẢNH CỦA 1 BÀI MẪU
// ==========================================
 
async function getImagesForSample(sampleId) {
 
    const { data, error } = await supabase
        .from(IMAGES_TABLE)
        .select("*")
        .eq("sample_id", sampleId)
        .order("sort_order", { ascending: true });
 
    if (error) {
        throw error;
    }
 
    return data || [];
}
 
 
// ==========================================
// HELPER: MAP 1 ROW DB → SHAPE UI ĐANG DÙNG
// ==========================================
 
function mapRecord(row, images = []) {
 
    return {
        id: row.id,
        content: row.content || "",
        source: row.source || "",
        note: row.note || "",
        tags: Array.isArray(row.tags) ? row.tags : [],
        engagement: row.engagement || {},
        adStatus: row.ad_status || "unknown",
        adConfidence:
            typeof row.ad_confidence === "number"
                ? row.ad_confidence
                : null,
        analyzed: !!row.analyzed,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        // UI đọc item.screenshots — ở đây là mảng URL ảnh public
        screenshots: images.map((img) => img.public_url),
    };
}
 
 
// ==========================================
// LẤY TẤT CẢ BÀI MẪU
// ==========================================
 
export async function getContentLibrary() {
 
    const { data: rows, error } = await supabase
        .from(TABLE)
        .select("*")
        .order("created_at", { ascending: false });
 
    if (error) {
        throw error;
    }
 
    const items = await Promise.all(
        (rows || []).map(async (row) => {
            const images = await getImagesForSample(row.id);
            return mapRecord(row, images);
        })
    );
 
    return items;
}
 
 
// ==========================================
// LẤY 1 BÀI MẪU
// ==========================================
 
export async function getContentSample(id) {
 
    if (!id) return null;
 
    const { data: row, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("id", id)
        .maybeSingle();
 
    if (error) {
        throw error;
    }
 
    if (!row) return null;
 
    const images = await getImagesForSample(id);
 
    return mapRecord(row, images);
}
 
 
// ==========================================
// LƯU BÀI MẪU MỚI
// ==========================================
 
export async function saveContentSample(sample = {}) {
 
    const { data: inserted, error } = await supabase
        .from(TABLE)
        .insert({
            content: sample.content || "",
            source: sample.source || "",
            note: sample.note || "",
            tags: sample.tags || [],
            engagement: sample.engagement || {},
            ad_status: "unknown",
            analyzed: false,
        })
        .select()
        .single();
 
    if (error) {
        throw error;
    }
 
    const sampleId = inserted.id;
 
    const screenshots = Array.isArray(sample.screenshots)
        ? sample.screenshots
        : [];
 
    let sortOrder = 0;
 
    for (const blob of screenshots) {
 
        // Bỏ qua nếu lỡ đã là URL string
        if (typeof blob === "string") continue;
 
        const uploaded = await uploadScreenshot(sampleId, blob);
 
        const { error: imgError } = await supabase
            .from(IMAGES_TABLE)
            .insert({
                sample_id: sampleId,
                storage_path: uploaded.storage_path,
                public_url: uploaded.public_url,
                sort_order: sortOrder,
            });
 
        if (imgError) {
            throw imgError;
        }
 
        sortOrder += 1;
    }
 
    return await getContentSample(sampleId);
}
 
 
// ==========================================
// CẬP NHẬT BÀI MẪU
// ==========================================
//
// updates.screenshots có thể chứa:
// - string  → URL ảnh cũ, giữ nguyên
// - Blob    → ảnh mới thêm, cần upload
// Ảnh cũ nào không còn trong danh sách → coi như ông đã xóa, xóa luôn.
//
 
export async function updateContentSample(id, updates = {}) {
 
    if (!id) {
        throw new Error("Thiếu ID bài mẫu.");
    }
 
    const payload = {};
 
    if (updates.content !== undefined) payload.content = updates.content;
    if (updates.source !== undefined) payload.source = updates.source;
    if (updates.note !== undefined) payload.note = updates.note;
    if (updates.tags !== undefined) payload.tags = updates.tags;
    if (updates.engagement !== undefined) payload.engagement = updates.engagement;
 
    payload.updated_at = new Date().toISOString();
 
    const { error: updateError } = await supabase
        .from(TABLE)
        .update(payload)
        .eq("id", id);
 
    if (updateError) {
        throw updateError;
    }
 
    if (Array.isArray(updates.screenshots)) {
 
        const existingImages = await getImagesForSample(id);
 
        const keptUrls = updates.screenshots.filter(
            (item) => typeof item === "string"
        );
 
        const toDelete = existingImages.filter(
            (img) => !keptUrls.includes(img.public_url)
        );
 
        for (const img of toDelete) {
            await deleteScreenshotFile(img.storage_path);
            await supabase.from(IMAGES_TABLE).delete().eq("id", img.id);
        }
 
        const newBlobs = updates.screenshots.filter(
            (item) => typeof item !== "string"
        );
 
        let sortOrder = existingImages.length;
 
        for (const blob of newBlobs) {
 
            const uploaded = await uploadScreenshot(id, blob);
 
            await supabase.from(IMAGES_TABLE).insert({
                sample_id: id,
                storage_path: uploaded.storage_path,
                public_url: uploaded.public_url,
                sort_order: sortOrder,
            });
 
            sortOrder += 1;
        }
    }
 
    return await getContentSample(id);
}
 
 
// ==========================================
// XÓA BÀI MẪU (kèm ảnh)
// ==========================================
 
export async function deleteContentSample(id) {
 
    if (!id) return false;
 
    const images = await getImagesForSample(id);
 
    for (const img of images) {
        await deleteScreenshotFile(img.storage_path);
    }
 
    await supabase.from(IMAGES_TABLE).delete().eq("sample_id", id);
    await supabase.from(TABLE).delete().eq("id", id);
 
    return true;
}
 
 
// ==========================================
// XÓA TOÀN BỘ THƯ VIỆN (dùng khi cần reset)
// ==========================================
 
export async function clearContentLibrary() {
 
    const items = await getContentLibrary();
 
    for (const item of items) {
        await deleteContentSample(item.id);
    }
 
    return true;
}
 
 
// ==========================================
// TÌM BÀI THEO TAG / SOURCE / NỘI DUNG
// ==========================================
 
export async function searchContentLibrary(keyword = "") {
 
    const items = await getContentLibrary();
 
    const query = String(keyword).trim().toLowerCase();
 
    if (!query) return items;
 
    return items.filter((item) => {
 
        const text = [
            item.content,
            item.source,
            item.note,
            ...(Array.isArray(item.tags) ? item.tags : []),
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
 
        return text.includes(query);
    });
}
 
 
// ==========================================
// LẤY CÁC BÀI CÓ TƯƠNG TÁC CAO
// ==========================================
 
export async function getHighEngagementSamples(limit = 10) {
 
    const items = await getContentLibrary();
 
    const scored = items.map((item) => {
 
        const likes = Number(item.engagement?.likes || 0);
        const comments = Number(item.engagement?.comments || 0);
        const shares = Number(item.engagement?.shares || 0);
 
        return {
            ...item,
            engagementScore: likes + comments * 2 + shares * 3,
        };
    });
 
    scored.sort((a, b) => b.engagementScore - a.engagementScore);
 
    return scored.slice(0, limit);
}
 
 
// ==========================================
// THỐNG KÊ (debug)
// ==========================================
 
export async function getContentLibraryStats() {
 
    const items = await getContentLibrary();
 
    let imageCount = 0;
 
    items.forEach((item) => {
        imageCount += item.screenshots.length;
    });
 
    return {
        totalSamples: items.length,
        imageCount,
    };
}
 
