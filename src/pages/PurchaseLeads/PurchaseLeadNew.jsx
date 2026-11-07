// ==========================================
// Thu mua xe — Thêm tin nhanh
// /purchase-leads/new?url=...&text=...
// (Phím tắt iPhone mở thẳng trang này kèm link / nội dung)
// ==========================================

import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
    parseLead,
    createLead,
    findDuplicates,
    parsePrice,
    formatPrice,
    formatPhone,
    MAX_LEAD_SCREENSHOTS,
    LEAD_STATUSES,
    SELLER_TYPES,
} from "../../services/purchaseLeadService";
import "./purchaseLeads.css";

const EMPTY = {
    source_type: "facebook",
    source_name: "",
    source_url: "",
    seller_name: "",
    phone: "",
    seller_type: "unknown",
    brand: "",
    model: "",
    version: "",
    year: "",
    odo_km: "",
    color: "",
    gearbox: "",
    location: "",
    asking_price: "",
    description: "",
    raw_text: "",
    notes: "",
    status: "new",
};

function looksLikeUrl(s) {
    return /^https?:\/\/\S+$/i.test((s || "").trim());
}

function extractUrl(s) {
    return (s || "").match(/https?:\/\/[^\s]+/i)?.[0] || "";
}

export default function PurchaseLeadNew() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const fileRef = useRef(null);

    const [input, setInput] = useState("");
    // Nhiều ảnh chụp của cùng 1 tin: [{ file, url }]
    const [shots, setShots] = useState([]);
    const [reading, setReading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [lead, setLead] = useState(null);
    const [priceText, setPriceText] = useState("");
    const [imageBlobs, setImageBlobs] = useState([]);
    const [dups, setDups] = useState([]);
    const [warnNotForSale, setWarnNotForSale] = useState(false);
    const autoRan = useRef(false);

    // Phím tắt iPhone truyền ?url= hoặc ?text=
    useEffect(() => {
        if (autoRan.current) return;
        const u = params.get("url") || "";
        const t = params.get("text") || "";
        const initial = u || t;
        if (!initial) return;
        autoRan.current = true;
        setInput(initial);
        runRead(initial, []);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function addShots(fileList) {
        const picked = Array.from(fileList || []).filter((f) => f.type.startsWith("image/"));
        if (!picked.length) return;
        const room = Math.max(0, MAX_LEAD_SCREENSHOTS - shots.length);
        if (picked.length > room) {
            setMessage(`Mỗi tin tối đa ${MAX_LEAD_SCREENSHOTS} ảnh chụp — con chỉ lấy ${room} ảnh đầu.`);
        }
        const added = picked.slice(0, room).map((f) => ({ file: f, url: URL.createObjectURL(f) }));
        setShots((cur) => [...cur, ...added].slice(0, MAX_LEAD_SCREENSHOTS));
    }

    function chooseFile(e) {
        addShots(e.target.files);
        e.target.value = ""; // chọn lại cùng ảnh vẫn nhận
    }

    function removeShot(index) {
        setShots((cur) => {
            URL.revokeObjectURL(cur[index]?.url);
            return cur.filter((_, i) => i !== index);
        });
    }

    function clearShots() {
        setShots((cur) => {
            cur.forEach((s) => URL.revokeObjectURL(s.url));
            return [];
        });
    }

    // Dán ảnh trực tiếp vào ô nội dung (Ctrl+V trên máy tính)
    function onInputPaste(e) {
        const imgs = Array.from(e.clipboardData?.files || []).filter((f) => f.type.startsWith("image/"));
        if (!imgs.length) return;
        e.preventDefault();
        addShots(imgs);
    }

    async function pasteClipboard() {
        try {
            if (navigator.clipboard?.read) {
                const items = await navigator.clipboard.read();
                for (const item of items) {
                    const imgType = item.types.find((t) => t.startsWith("image/"));
                    if (imgType) {
                        const blob = await item.getType(imgType);
                        addShots([new File([blob], `clipboard-${Date.now()}.png`, { type: imgType })]);
                        return;
                    }
                }
            }
            const t = await navigator.clipboard.readText();
            if (t) setInput(t);
        } catch {
            setMessage("Không đọc được bộ nhớ tạm. Ông giữ vào ô bên dưới rồi chọn Dán nhé.");
        }
    }

    async function runRead(textOrUrl = input, files = shots.map((s) => s.file)) {
        const raw = (textOrUrl || "").trim();
        if (!raw && !files.length) {
            setMessage("Ông dán nội dung / link, hoặc chọn ảnh chụp màn hình trước nhé.");
            return;
        }
        setReading(true);
        setMessage("");
        setWarnNotForSale(false);
        try {
            const url = looksLikeUrl(raw) ? raw : extractUrl(raw);
            const text = looksLikeUrl(raw) ? "" : raw;
            const result = await parseLead({ url, text, files });

            if (result.need_screenshot && !files.length) {
                setMessage(result.message);
                setLead(null);
                return;
            }

            const next = {
                ...EMPTY,
                ...Object.fromEntries(
                    Object.entries(result).filter(([k, v]) => k in EMPTY && v !== null && v !== undefined)
                ),
                source_url: result.source_url || url || "",
                ai_confidence: result.confidence,
            };
            if (!next.source_name && next.source_type === "facebook") next.source_name = "Facebook";
            setLead(next);
            setPriceText(result.asking_price ? formatPrice(result.asking_price) : "");
            setImageBlobs(result._imageBlobs || []);
            setWarnNotForSale(result.is_car_for_sale === false);
            setDups(await findDuplicates({ phone: next.phone, sourceUrl: next.source_url }));
            if (!next.phone) setMessage("Chưa thấy số điện thoại trong tin. Ông nhập tay nếu có nhé.");
        } catch (e) {
            setMessage("Lỗi đọc tin: " + e.message);
        } finally {
            setReading(false);
        }
    }

    function setField(k, v) {
        setLead((l) => ({ ...l, [k]: v }));
    }

    async function onPhoneBlur() {
        if (!lead) return;
        setDups(await findDuplicates({ phone: lead.phone, sourceUrl: lead.source_url }));
    }

    async function save(goNext) {
        if (!lead) return;
        if (!lead.phone && !window.confirm("Tin này chưa có số điện thoại. Vẫn lưu?")) return;
        setSaving(true);
        try {
            const row = { ...lead, asking_price: parsePrice(priceText) };
            await createLead(row, imageBlobs);
            if (goNext) {
                setLead(null);
                setInput("");
                clearShots();
                setImageBlobs([]);
                setDups([]);
                setPriceText("");
                setMessage("✅ Đã lưu. Gửi tin tiếp theo nhé.");
                if (fileRef.current) fileRef.current.value = "";
            } else {
                navigate("/purchase-leads");
            }
        } catch (e) {
            setMessage("Lỗi lưu: " + e.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="content pl-page">
            <div className="pl-header">
                <Link to="/purchase-leads" className="pl-back">← Danh sách</Link>
                <h1>➕ Thêm xe thu mua</h1>
            </div>

            {/* ---------- Bước 1: đưa tin vào ---------- */}
            <section className="pl-card">
                <textarea
                    className="pl-input"
                    rows={lead ? 2 : 5}
                    placeholder="Dán nội dung bài đăng hoặc link tin rao (bonbanh, oto.com.vn, chotot...)"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onPaste={onInputPaste}
                />
                <div className="pl-row">
                    <button type="button" className="pl-btn ghost" onClick={pasteClipboard}>📋 Dán</button>
                    <button type="button" className="pl-btn ghost" onClick={() => fileRef.current?.click()}>
                        🖼️ {shots.length ? `Thêm ảnh chụp (${shots.length}/${MAX_LEAD_SCREENSHOTS})` : "Ảnh chụp màn hình"}
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={chooseFile} />
                </div>
                {shots.length > 0 && (
                    <>
                        <div className={shots.length > 1 ? "pl-shots" : ""}>
                            {shots.map((s, i) => (
                                <div className="pl-preview" key={s.url}>
                                    <img src={s.url} alt={`Ảnh chụp ${i + 1}`} />
                                    {shots.length > 1 && <span className="pl-shot-no">{i + 1}</span>}
                                    <button type="button" className="pl-x" onClick={() => removeShot(i)}>
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                        {shots.length > 1 && (
                            <p className="pl-hint">AI sẽ đọc {shots.length} ảnh như CÙNG 1 tin (bài dài chụp nhiều lần, ảnh bình luận có SĐT…).</p>
                        )}
                    </>
                )}
                <button
                    type="button"
                    className="pl-btn primary full"
                    disabled={reading}
                    onClick={() => runRead()}
                >
                    {reading ? "⏳ AI đang đọc tin..." : "🤖 Đọc thông tin xe"}
                </button>
                {message && <p className="pl-msg">{message}</p>}
            </section>

            {/* ---------- Bước 2: xem lại & lưu ---------- */}
            {lead && (
                <section className="pl-card">
                    {warnNotForSale && (
                        <p className="pl-warn">⚠️ AI thấy bài này có vẻ không phải rao bán xe (hỏi mua / quảng cáo).</p>
                    )}
                    {lead.seller_type === "dealer" && (
                        <p className="pl-warn">⚠️ Có vẻ là salon / cò, không phải xe dân.</p>
                    )}
                    {dups.length > 0 && (
                        <div className="pl-dup">
                            <b>🔁 Đã có {dups.length} tin trùng số / link:</b>
                            {dups.map((d) => (
                                <Link key={d.id} to={`/purchase-leads?open=${d.id}`}>
                                    {[d.brand, d.model, d.year].filter(Boolean).join(" ") || "Xe"} ·{" "}
                                    {LEAD_STATUSES.find((s) => s.value === d.status)?.label} ·{" "}
                                    {new Date(d.created_at).toLocaleDateString("vi-VN")}
                                </Link>
                            ))}
                        </div>
                    )}

                    <div className="pl-grid">
                        <label className="span2">
                            Số điện thoại
                            <input
                                inputMode="tel"
                                value={lead.phone}
                                onChange={(e) => setField("phone", e.target.value)}
                                onBlur={onPhoneBlur}
                            />
                            {lead.phone && <small>{formatPhone(lead.phone)}</small>}
                        </label>
                        <label>
                            Tên người bán
                            <input value={lead.seller_name} onChange={(e) => setField("seller_name", e.target.value)} />
                        </label>
                        <label>
                            Loại người bán
                            <select value={lead.seller_type} onChange={(e) => setField("seller_type", e.target.value)}>
                                {Object.entries(SELLER_TYPES).map(([v, l]) => (
                                    <option key={v} value={v}>{l}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Hãng
                            <input value={lead.brand} onChange={(e) => setField("brand", e.target.value)} />
                        </label>
                        <label>
                            Dòng xe
                            <input value={lead.model} onChange={(e) => setField("model", e.target.value)} />
                        </label>
                        <label>
                            Phiên bản
                            <input value={lead.version} onChange={(e) => setField("version", e.target.value)} />
                        </label>
                        <label>
                            Đời (năm)
                            <input inputMode="numeric" value={lead.year} onChange={(e) => setField("year", e.target.value)} />
                        </label>
                        <label>
                            Số km
                            <input inputMode="numeric" value={lead.odo_km} onChange={(e) => setField("odo_km", e.target.value)} />
                        </label>
                        <label>
                            Giá rao
                            <input
                                placeholder="vd 520tr, 1 tỷ 150"
                                value={priceText}
                                onChange={(e) => setPriceText(e.target.value)}
                            />
                            {priceText && parsePrice(priceText) && (
                                <small>= {parsePrice(priceText).toLocaleString("vi-VN")} đ</small>
                            )}
                        </label>
                        <label>
                            Màu
                            <input value={lead.color} onChange={(e) => setField("color", e.target.value)} />
                        </label>
                        <label>
                            Hộp số
                            <input value={lead.gearbox} onChange={(e) => setField("gearbox", e.target.value)} />
                        </label>
                        <label className="span2">
                            Khu vực
                            <input value={lead.location} onChange={(e) => setField("location", e.target.value)} />
                        </label>
                        <label className="span2">
                            Tình trạng xe
                            <textarea rows={2} value={lead.description} onChange={(e) => setField("description", e.target.value)} />
                        </label>
                        <label>
                            Nguồn
                            <select value={lead.source_type} onChange={(e) => setField("source_type", e.target.value)}>
                                <option value="facebook">Facebook</option>
                                <option value="website">Trang web</option>
                                <option value="other">Khác</option>
                            </select>
                        </label>
                        <label>
                            Tên nhóm / trang
                            <input value={lead.source_name} onChange={(e) => setField("source_name", e.target.value)} />
                        </label>
                        <label className="span2">
                            Link bài
                            <input value={lead.source_url} onChange={(e) => setField("source_url", e.target.value)} />
                        </label>
                        <label className="span2">
                            Ghi chú
                            <textarea rows={2} value={lead.notes} onChange={(e) => setField("notes", e.target.value)} />
                        </label>
                    </div>

                    <div className="pl-row">
                        <button type="button" className="pl-btn primary" disabled={saving} onClick={() => save(true)}>
                            💾 Lưu & thêm tiếp
                        </button>
                        <button type="button" className="pl-btn" disabled={saving} onClick={() => save(false)}>
                            Lưu & xem danh sách
                        </button>
                    </div>
                </section>
            )}
        </main>
    );
}
