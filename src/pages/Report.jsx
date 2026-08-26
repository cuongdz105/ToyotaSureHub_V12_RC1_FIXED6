import { useEffect, useMemo, useState } from "react";

import SectionCard from "../components/Common/SectionCard";
import PrimaryButton from "../components/Common/PrimaryButton";

import { getCars } from "../services/carService";

import {
    getPostingReports,
    summarizeByModel,
    summarizeByCar,
    summarizeByAccount,
    summarizeByGroup,
    evaluateCar,
    EVALUATION_THRESHOLDS,
} from "../services/reportService";


// ==========================================
// KHOẢNG THỜI GIAN
// ==========================================

const RANGE_OPTIONS = [
    { key: "today", label: "Hôm nay" },
    { key: "7d", label: "7 ngày" },
    { key: "30d", label: "30 ngày" },
    { key: "month", label: "Tháng này" },
    { key: "year", label: "Năm nay" },
    { key: "custom", label: "Tùy chọn" },
];

function getRangeDates(rangeKey, customFrom, customTo) {
    const now = new Date();
    let from = null;
    let to = null;

    if (rangeKey === "today") {
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (rangeKey === "7d") {
        from = new Date(now);
        from.setDate(from.getDate() - 6);
        from.setHours(0, 0, 0, 0);
        to = now;
    } else if (rangeKey === "30d") {
        from = new Date(now);
        from.setDate(from.getDate() - 29);
        from.setHours(0, 0, 0, 0);
        to = now;
    } else if (rangeKey === "month") {
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = now;
    } else if (rangeKey === "year") {
        from = new Date(now.getFullYear(), 0, 1);
        to = now;
    } else if (rangeKey === "custom") {
        from = customFrom ? new Date(customFrom) : null;
        to = customTo ? new Date(customTo + "T23:59:59") : null;
    }

    return {
        from: from ? from.toISOString() : null,
        to: to ? to.toISOString() : null,
    };
}

function daysBetween(dateStr) {
    if (!dateStr) return 0;
    const created = new Date(dateStr).getTime();
    if (Number.isNaN(created)) return 0;
    const diff = Date.now() - created;
    return Math.max(0, Math.floor(diff / (24 * 60 * 60 * 1000)));
}

function formatDate(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("vi-VN");
}

function formatDateTime(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString("vi-VN");
}


function Report() {

    const [rangeKey, setRangeKey] =
        useState("7d");

    const [customFrom, setCustomFrom] =
        useState("");

    const [customTo, setCustomTo] =
        useState("");

    const [reports, setReports] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [carSort, setCarSort] =
        useState("count_desc");

    const [modelSort, setModelSort] =
        useState("count_desc");


    // ==========================================
    // LOAD DỮ LIỆU
    // ==========================================

    useEffect(() => {
        async function load() {
            setLoading(true);

            const { from, to } = getRangeDates(rangeKey, customFrom, customTo);
            const data = await getPostingReports(from, to);

            setReports(data);
            setLoading(false);
        }

        load();
    }, [rangeKey, customFrom, customTo]);


    const cars = getCars();


    // ==========================================
    // TỔNG HỢP
    // ==========================================

    const byModel = useMemo(
        () => summarizeByModel(reports),
        [reports]
    );

    const byAccount = useMemo(
        () => summarizeByAccount(reports),
        [reports]
    );

    const byGroup = useMemo(
        () => summarizeByGroup(reports),
        [reports]
    );

    const byCarRaw = useMemo(
        () => summarizeByCar(reports),
        [reports]
    );

    // Kết hợp thêm ngày bắt đầu bán + đánh giá 🟢🟡🔴
    const byCar = useMemo(() => {
        return byCarRaw.map((entry) => {
            const car = cars.find(
                (item) => String(item.id) === String(entry.carId)
            );

            const daysSelling = car ? daysBetween(car.createdAt) : null;

            const evaluation =
                daysSelling !== null
                    ? evaluateCar({
                          daysSelling,
                          totalPosts: entry.count,
                      })
                    : null;

            return {
                ...entry,
                daysSelling,
                currentPrice: car?.price ?? entry.lastPrice,
                evaluation,
            };
        });
    }, [byCarRaw, cars]);

    const sortedByCar = useMemo(() => {
        const list = [...byCar];

        if (carSort === "count_desc") {
            list.sort((a, b) => b.count - a.count);
        } else if (carSort === "days_desc") {
            list.sort((a, b) => (b.daysSelling || 0) - (a.daysSelling || 0));
        } else if (carSort === "name") {
            list.sort((a, b) =>
                `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`)
            );
        }

        return list;
    }, [byCar, carSort]);

    const sortedByModel = useMemo(() => {
        const list = [...byModel];

        if (modelSort === "count_desc") {
            list.sort((a, b) => b.count - a.count);
        } else if (modelSort === "count_asc") {
            list.sort((a, b) => a.count - b.count);
        } else if (modelSort === "name") {
            list.sort((a, b) => a.model.localeCompare(b.model));
        }

        return list;
    }, [byModel, modelSort]);


    const total = reports.length;

    const maxModelCount = Math.max(1, ...byModel.map((m) => m.count));


    // ==========================================
    // RENDER
    // ==========================================

    return (

        <main className="content">

            <h1>📊 Báo cáo đăng bài</h1>

            <p style={{ color: "#666", marginTop: 0 }}>
                Thống kê dựa trên các lượt ông xác nhận
                "Đã đăng thành công" trong Facebook Queue.
            </p>


            {/* =================================
                BỘ LỌC THỜI GIAN
            ================================= */}

            <SectionCard title="🗓️ Khoảng thời gian">

                <div
                    style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                    }}
                >
                    {RANGE_OPTIONS.map((option) => (
                        <PrimaryButton
                            key={option.key}
                            onClick={() => setRangeKey(option.key)}
                            style={{
                                background:
                                    rangeKey === option.key
                                        ? "#1976d2"
                                        : "#999",
                            }}
                        >
                            {option.label}
                        </PrimaryButton>
                    ))}
                </div>

                {rangeKey === "custom" && (
                    <div
                        style={{
                            display: "flex",
                            gap: "10px",
                            marginTop: "12px",
                            flexWrap: "wrap",
                            alignItems: "center",
                        }}
                    >
                        <label>
                            Từ ngày:{" "}
                            <input
                                type="date"
                                value={customFrom}
                                onChange={(e) => setCustomFrom(e.target.value)}
                                style={{ padding: "6px" }}
                            />
                        </label>

                        <label>
                            Đến ngày:{" "}
                            <input
                                type="date"
                                value={customTo}
                                onChange={(e) => setCustomTo(e.target.value)}
                                style={{ padding: "6px" }}
                            />
                        </label>
                    </div>
                )}

            </SectionCard>


            {/* =================================
                TỔNG QUAN
            ================================= */}

            <SectionCard title="📈 Tổng quan">

                {loading ? (
                    <p>⏳ Đang tải...</p>
                ) : (
                    <div
                        style={{
                            fontSize: "32px",
                            fontWeight: "700",
                            color: "#1976d2",
                        }}
                    >
                        {total} <span style={{ fontSize: "16px", color: "#666", fontWeight: "400" }}>bài đã đăng</span>
                    </div>
                )}

            </SectionCard>


            {/* =================================
                THEO MẪU XE
            ================================= */}

            <SectionCard title="🚗 Thống kê theo mẫu xe">

                <div style={{ marginBottom: "10px" }}>
                    <select
                        value={modelSort}
                        onChange={(e) => setModelSort(e.target.value)}
                        style={{ padding: "6px" }}
                    >
                        <option value="count_desc">Nhiều nhất → ít nhất</option>
                        <option value="count_asc">Ít nhất → nhiều nhất</option>
                        <option value="name">Theo tên xe</option>
                    </select>
                </div>

                {sortedByModel.length === 0 ? (
                    <p style={{ color: "#777" }}>Chưa có dữ liệu.</p>
                ) : (
                    <div style={{ display: "grid", gap: "8px" }}>
                        {sortedByModel.map((item) => (
                            <div key={item.model}>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        marginBottom: "3px",
                                    }}
                                >
                                    <span>{item.model}</span>
                                    <strong>{item.count}</strong>
                                </div>

                                <div
                                    style={{
                                        height: "8px",
                                        background: "#eee",
                                        borderRadius: "4px",
                                        overflow: "hidden",
                                    }}
                                >
                                    <div
                                        style={{
                                            height: "100%",
                                            width: `${(item.count / maxModelCount) * 100}%`,
                                            background: "#1976d2",
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </SectionCard>


            {/* =================================
                THEO TỪNG XE CỤ THỂ
            ================================= */}

            <SectionCard title="🔍 Thống kê theo từng xe">

                <div style={{ marginBottom: "10px" }}>
                    <select
                        value={carSort}
                        onChange={(e) => setCarSort(e.target.value)}
                        style={{ padding: "6px" }}
                    >
                        <option value="count_desc">Đăng nhiều nhất trước</option>
                        <option value="days_desc">Bán lâu nhất trước</option>
                        <option value="name">Theo tên xe</option>
                    </select>
                </div>

                {sortedByCar.length === 0 ? (
                    <p style={{ color: "#777" }}>Chưa có dữ liệu.</p>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ textAlign: "left", borderBottom: "2px solid #ddd" }}>
                                    <th style={{ padding: "8px" }}>Xe</th>
                                    <th style={{ padding: "8px" }}>Giá hiện tại</th>
                                    <th style={{ padding: "8px" }}>Ngày bán</th>
                                    <th style={{ padding: "8px" }}>Đã đăng</th>
                                    <th style={{ padding: "8px" }}>Lần gần nhất</th>
                                    <th style={{ padding: "8px" }}>Đánh giá</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedByCar.map((entry) => (
                                    <tr key={entry.carId} style={{ borderBottom: "1px solid #eee" }}>
                                        <td style={{ padding: "8px" }}>
                                            {entry.brand} {entry.model} {entry.version} {entry.year}
                                            {entry.color ? ` — ${entry.color}` : ""}
                                        </td>
                                        <td style={{ padding: "8px" }}>
                                            {entry.currentPrice ? `${entry.currentPrice} triệu` : "-"}
                                        </td>
                                        <td style={{ padding: "8px" }}>
                                            {entry.daysSelling !== null ? `${entry.daysSelling} ngày` : "-"}
                                        </td>
                                        <td style={{ padding: "8px" }}>
                                            <strong>{entry.count}</strong>
                                        </td>
                                        <td style={{ padding: "8px" }}>
                                            {formatDateTime(entry.lastPostedAt)}
                                        </td>
                                        <td style={{ padding: "8px" }}>
                                            {entry.evaluation?.label || "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div
                    style={{
                        marginTop: "14px",
                        padding: "10px",
                        background: "#f5f5f5",
                        borderRadius: "8px",
                        fontSize: "13px",
                        color: "#666",
                    }}
                >
                    ⚠️ Đánh giá chỉ là tín hiệu tham khảo (dựa trên số ngày bán
                    và số lượt đăng), không kết luận nguyên nhân cụ thể.
                    Ngưỡng hiện tại: 🟡 từ {EVALUATION_THRESHOLDS.yellowDays} ngày
                    hoặc {EVALUATION_THRESHOLDS.yellowPosts} lượt đăng · 🔴 từ{" "}
                    {EVALUATION_THRESHOLDS.redDays} ngày và{" "}
                    {EVALUATION_THRESHOLDS.redPosts} lượt đăng.
                </div>

            </SectionCard>


            {/* =================================
                THEO ACCOUNT
            ================================= */}

            <SectionCard title="👤 Theo tài khoản Facebook">
                {byAccount.length === 0 ? (
                    <p style={{ color: "#777" }}>Chưa có dữ liệu.</p>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <tbody>
                            {byAccount.map((item) => (
                                <tr key={item.account} style={{ borderBottom: "1px solid #eee" }}>
                                    <td style={{ padding: "8px" }}>{item.account}</td>
                                    <td style={{ padding: "8px", textAlign: "right" }}>
                                        <strong>{item.count}</strong>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </SectionCard>


            {/* =================================
                THEO GROUP
            ================================= */}

            <SectionCard title="👥 Theo nhóm Facebook">
                {byGroup.length === 0 ? (
                    <p style={{ color: "#777" }}>Chưa có dữ liệu.</p>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <tbody>
                            {byGroup.map((item) => (
                                <tr key={item.group} style={{ borderBottom: "1px solid #eee" }}>
                                    <td style={{ padding: "8px" }}>{item.group}</td>
                                    <td style={{ padding: "8px", textAlign: "right" }}>
                                        <strong>{item.count}</strong>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </SectionCard>

        </main>
    );
}

export default Report;