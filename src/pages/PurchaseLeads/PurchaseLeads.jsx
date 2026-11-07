// ==========================================
// Thu mua xe — Danh sách chăm sóc
// ==========================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
    listLeads,
    updateLead,
    deleteLead,
    getScreenshotUrl,
    formatPhone,
    formatPrice,
    parsePrice,
    zaloLink,
    normalizePhone,
    LEAD_STATUSES,
    SELLER_TYPES,
} from "../../services/purchaseLeadService";
import "./purchaseLeads.css";

function statusOf(v) {
    return LEAD_STATUSES.find((s) => s.value === v) || LEAD_STATUSES[0];
}

function carTitle(l) {
    return [l.brand, l.model, l.version, l.year].filter(Boolean).join(" ") || "Xe chưa rõ";
}

function timeAgo(iso) {
    const diff = (Date.now() - new Date(iso).getTime()) / 60000;
    if (diff < 60) return `${Math.max(1, Math.round(diff))} phút trước`;
    if (diff < 1440) return `${Math.round(diff / 60)} giờ trước`;
    return new Date(iso).toLocaleDateString("vi-VN");
}

function toLocalInput(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ---------- Chi tiết 1 tin ----------
function LeadDetail({ lead, onChanged, onDeleted }) {
    const [note, setNote] = useState("");
    const [offer, setOffer] = useState(lead.offered_price ? formatPrice(lead.offered_price) : "");
    const [deal, setDeal] = useState(lead.deal_price ? formatPrice(lead.deal_price) : "");
    const [followUp, setFollowUp] = useState(toLocalInput(lead.next_follow_up_at));
    const [shot, setShot] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        let alive = true;
        if (lead.screenshot_path) getScreenshotUrl(lead.screenshot_path).then((u) => alive && setShot(u));
        return () => {
            alive = false;
        };
    }, [lead.screenshot_path]);

    async function apply(patch, logNote) {
        setBusy(true);
        try {
            const updated = await updateLead(lead.id, patch, { logNote });
            onChanged(updated);
        } catch (e) {
            alert("Lỗi lưu: " + e.message);
        } finally {
            setBusy(false);
        }
    }

    async function saveNegotiation() {
        await apply(
            {
                offered_price: parsePrice(offer),
                deal_price: parsePrice(deal),
                next_follow_up_at: followUp ? new Date(followUp).toISOString() : null,
            },
            note.trim() || undefined
        );
        setNote("");
    }

    const log = Array.isArray(lead.contact_log) ? [...lead.contact_log].reverse() : [];

    return (
        <div className="pl-detail">
            <div className="pl-status-row">
                {LEAD_STATUSES.map((s) => (
                    <button
                        key={s.value}
                        type="button"
                        disabled={busy}
                        className={`pl-chip${lead.status === s.value ? " on" : ""}`}
                        style={lead.status === s.value ? { background: s.color, borderColor: s.color } : undefined}
                        onClick={() => lead.status !== s.value && apply({ status: s.value })}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            <dl className="pl-facts">
                {lead.odo_km && (<><dt>Số km</dt><dd>{Number(lead.odo_km).toLocaleString("vi-VN")} km</dd></>)}
                {lead.color && (<><dt>Màu</dt><dd>{lead.color}</dd></>)}
                {lead.gearbox && (<><dt>Hộp số</dt><dd>{lead.gearbox}</dd></>)}
                {lead.location && (<><dt>Khu vực</dt><dd>{lead.location}</dd></>)}
                <dt>Người bán</dt>
                <dd>{[lead.seller_name, SELLER_TYPES[lead.seller_type]].filter(Boolean).join(" · ")}</dd>
                <dt>Nguồn</dt>
                <dd>
                    {lead.source_url ? (
                        <a href={lead.source_url} target="_blank" rel="noreferrer">{lead.source_name || "Mở bài"} ↗</a>
                    ) : (
                        lead.source_name || "—"
                    )}
                </dd>
            </dl>
            {lead.description && <p className="pl-desc">{lead.description}</p>}
            {shot && (
                <a href={shot} target="_blank" rel="noreferrer" className="pl-shot">
                    <img src={shot} alt="Ảnh bài đăng" />
                </a>
            )}

            <div className="pl-grid">
                <label>
                    Giá mình trả
                    <input placeholder="vd 480tr" value={offer} onChange={(e) => setOffer(e.target.value)} />
                </label>
                <label>
                    Giá chốt
                    <input placeholder="vd 495tr" value={deal} onChange={(e) => setDeal(e.target.value)} />
                </label>
                <label className="span2">
                    Hẹn gọi lại
                    <input type="datetime-local" value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
                </label>
                <label className="span2">
                    Ghi chú cuộc gọi
                    <textarea
                        rows={2}
                        placeholder="vd: chủ xe muốn 520, hẹn cuối tuần xem xe"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                    />
                </label>
            </div>
            <div className="pl-row">
                <button type="button" className="pl-btn primary" disabled={busy} onClick={saveNegotiation}>
                    💾 Lưu
                </button>
                <button
                    type="button"
                    className="pl-btn danger"
                    disabled={busy}
                    onClick={async () => {
                        if (!window.confirm("Xoá tin này?")) return;
                        await deleteLead(lead);
                        onDeleted(lead.id);
                    }}
                >
                    Xoá
                </button>
            </div>

            {log.length > 0 && (
                <ul className="pl-log">
                    {log.map((x, i) => (
                        <li key={i}>
                            <span>{new Date(x.at).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}</span>
                            <b>{statusOf(x.status).label}</b>
                            {x.note && <em>{x.note}</em>}
                        </li>
                    ))}
                </ul>
            )}
            {lead.notes && <p className="pl-desc">📝 {lead.notes}</p>}
        </div>
    );
}

// ---------- Trang danh sách ----------
export default function PurchaseLeads() {
    const [params, setParams] = useSearchParams();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [status, setStatus] = useState("");
    const [search, setSearch] = useState("");
    const [openId, setOpenId] = useState(params.get("open") || "");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            setLeads(await listLeads());
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const counts = useMemo(() => {
        const c = {};
        for (const l of leads) c[l.status] = (c[l.status] || 0) + 1;
        return c;
    }, [leads]);

    // số điện thoại xuất hiện nhiều lần → có thể là cò
    const phoneCount = useMemo(() => {
        const c = {};
        for (const l of leads) if (l.phone_normalized) c[l.phone_normalized] = (c[l.phone_normalized] || 0) + 1;
        return c;
    }, [leads]);

    const dueCount = useMemo(
        () =>
            leads.filter(
                (l) => l.next_follow_up_at && new Date(l.next_follow_up_at) <= new Date() && !["bought", "dropped"].includes(l.status)
            ).length,
        [leads]
    );

    const shown = useMemo(() => {
        const s = search.trim().toLowerCase();
        const sDigits = s.replace(/\D/g, "");
        return leads.filter((l) => {
            if (status === "due") {
                if (!l.next_follow_up_at || new Date(l.next_follow_up_at) > new Date()) return false;
                if (["bought", "dropped"].includes(l.status)) return false;
            } else if (status && l.status !== status) return false;
            if (!s) return true;
            if (sDigits.length >= 4 && (l.phone_normalized || "").includes(sDigits)) return true;
            return [l.brand, l.model, l.version, l.location, l.seller_name, l.source_name, l.notes, String(l.year || "")]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(s);
        });
    }, [leads, status, search]);

    function toggle(id) {
        const next = openId === id ? "" : id;
        setOpenId(next);
        if (params.get("open")) setParams({}, { replace: true });
    }

    return (
        <main className="content pl-page">
            <div className="pl-header">
                <h1>🔎 Thu mua xe</h1>
                <Link to="/purchase-leads/new" className="pl-btn primary">+ Thêm tin</Link>
            </div>

            <input
                className="pl-search"
                placeholder="Tìm số điện thoại, dòng xe, khu vực..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            <div className="pl-status-row scroll">
                <button type="button" className={`pl-chip${!status ? " on" : ""}`} onClick={() => setStatus("")}>
                    Tất cả {leads.length}
                </button>
                {dueCount > 0 && (
                    <button type="button" className={`pl-chip due${status === "due" ? " on" : ""}`} onClick={() => setStatus("due")}>
                        ⏰ Cần gọi lại {dueCount}
                    </button>
                )}
                {LEAD_STATUSES.map((s) => (
                    <button
                        key={s.value}
                        type="button"
                        className={`pl-chip${status === s.value ? " on" : ""}`}
                        onClick={() => setStatus(s.value)}
                    >
                        {s.label} {counts[s.value] || 0}
                    </button>
                ))}
            </div>

            {loading && <p className="pl-msg">Đang tải...</p>}
            {error && <p className="pl-warn">Lỗi: {error}. Ông đã chạy file SQL 20261107_purchase_leads.sql chưa?</p>}
            {!loading && !error && shown.length === 0 && (
                <div className="pl-card pl-empty">
                    <p>Chưa có tin nào.</p>
                    <p>Gặp xe dân bán trên nhóm Facebook hay bonbanh, oto.com.vn… ông chụp màn hình hoặc chia sẻ link vào đây.</p>
                </div>
            )}

            <div className="pl-list">
                {shown.map((l) => {
                    const st = statusOf(l.status);
                    const zalo = zaloLink(l.phone);
                    const many = l.phone_normalized && phoneCount[l.phone_normalized] > 1;
                    return (
                        <article key={l.id} className={`pl-item${openId === l.id ? " open" : ""}`}>
                            <div className="pl-item-head" onClick={() => toggle(l.id)}>
                                <div className="pl-item-main">
                                    <div className="pl-item-title">
                                        {carTitle(l)}
                                        {l.seller_type === "dealer" && <span className="pl-tag dealer">salon/cò</span>}
                                        {l.seller_type === "individual" && <span className="pl-tag ind">xe dân</span>}
                                        {many && <span className="pl-tag dealer">số đăng {phoneCount[l.phone_normalized]} xe</span>}
                                    </div>
                                    <div className="pl-item-sub">
                                        {l.asking_price ? <b>{formatPrice(l.asking_price)}</b> : null}
                                        {l.odo_km ? <span>{Math.round(l.odo_km / 1000)}k km</span> : null}
                                        {l.location ? <span>{l.location}</span> : null}
                                        <span>{timeAgo(l.created_at)}</span>
                                    </div>
                                </div>
                                <span className="pl-badge" style={{ background: st.color }}>{st.label}</span>
                            </div>
                            <div className="pl-actions">
                                {normalizePhone(l.phone) ? (
                                    <>
                                        <a className="pl-btn call" href={`tel:${normalizePhone(l.phone)}`}>📞 {formatPhone(l.phone)}</a>
                                        {zalo && <a className="pl-btn zalo" href={zalo} target="_blank" rel="noreferrer">Zalo</a>}
                                    </>
                                ) : (
                                    <span className="pl-msg">Chưa có số</span>
                                )}
                            </div>
                            {openId === l.id && (
                                <LeadDetail
                                    lead={l}
                                    onChanged={(u) => setLeads((all) => all.map((x) => (x.id === u.id ? u : x)))}
                                    onDeleted={(id) => setLeads((all) => all.filter((x) => x.id !== id))}
                                />
                            )}
                        </article>
                    );
                })}
            </div>
        </main>
    );
}
