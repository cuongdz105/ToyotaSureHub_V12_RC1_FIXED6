import { useState } from "react";

import {
    researchYouTubeQuery,
} from "../ai/research/youtubeResearchService";

function formatNumber(value) {

    return Number(value || 0).toLocaleString(
        "vi-VN"
    );

}


function formatDate(value) {

    if (!value) {
        return "-";
    }

    return new Date(value).toLocaleDateString(
        "vi-VN"
    );

}


function formatDuration(seconds) {

    const value =
        Number(seconds || 0);

    if (value < 60) {

        return `${value}s`;

    }

    const minutes =
        Math.floor(value / 60);

    const remainingSeconds =
        value % 60;

    return `${minutes}:${String(
        remainingSeconds
    ).padStart(2, "0")}`;

}


function YouTubeResearchPanel() {

    const [query, setQuery] =
        useState("Toyota Corolla Cross");

    const [results, setResults] =
        useState([]);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");


    async function handleResearch() {

        if (!query.trim()) {

            setError(
                "Ông nhập từ khóa trước nhé."
            );

            return;

        }


        setLoading(true);

        setError("");

        setResults([]);


        try {

            const data =
                await researchYouTubeQuery({

                    query:
                        query.trim(),

                    maxResults:
                        10,

                    order:
                        "relevance",

                });


            setResults(data);

        } catch (err) {

            console.error(
                "YouTube Research:",
                err
            );


            setError(
                err?.message ||
                "Không lấy được dữ liệu YouTube."
            );

        } finally {

            setLoading(false);

        }

    }


    return (

        <section
            style={{
                background: "#fff",
                border: "1px solid #ddd",
                borderRadius: "12px",
                padding: "20px",
                marginTop: "20px",
            }}
        >

            <div
                style={{
                    display: "flex",
                    justifyContent:
                        "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                }}
            >

                <div>

                    <h2
                        style={{
                            margin: 0,
                        }}
                    >
                        🎬 YouTube Research
                    </h2>

                    <p
                        style={{
                            margin:
                                "6px 0 0",
                            color: "#666",
                        }}
                    >
                        Tìm các video để ToyotaSureHub
                        nghiên cứu và học cách triển khai
                        nội dung.
                    </p>

                </div>

            </div>


            {/* SEARCH */}

            <div
                style={{
                    display: "flex",
                    gap: "10px",
                    marginBottom: "20px",
                }}
            >

                <input
                    type="text"
                    value={query}
                    onChange={(event) =>
                        setQuery(
                            event.target.value
                        )
                    }
                    onKeyDown={(event) => {

                        if (
                            event.key === "Enter"
                        ) {

                            handleResearch();

                        }

                    }}
                    placeholder="Ví dụ: Toyota Vios 2023"
                    style={{
                        flex: 1,
                        minWidth: 0,
                        padding:
                            "11px 14px",
                        border:
                            "1px solid #ccc",
                        borderRadius:
                            "8px",
                        fontSize:
                            "15px",
                    }}
                />


                <button
                    type="button"
                    onClick={
                        handleResearch
                    }
                    disabled={loading}
                    style={{
                        padding:
                            "11px 18px",
                        border: "none",
                        borderRadius:
                            "8px",
                        background:
                            "#e21b23",
                        color: "#fff",
                        fontWeight:
                            "600",
                        cursor:
                            loading
                                ? "default"
                                : "pointer",
                    }}
                >

                    {loading
                        ? "⏳ Đang tìm..."
                        : "🔎 Tìm video"}

                </button>

            </div>


            {/* ERROR */}

            {error && (

                <div
                    style={{
                        padding:
                            "12px 14px",
                        marginBottom:
                            "16px",
                        background:
                            "#fff1f1",
                        border:
                            "1px solid #ffcaca",
                        borderRadius:
                            "8px",
                        color:
                            "#c62828",
                    }}
                >

                    ❌ {error}

                </div>

            )}


            {/* EMPTY */}

            {!loading &&
                !error &&
                results.length === 0 && (

                    <div
                        style={{
                            padding:
                                "30px",
                            textAlign:
                                "center",
                            color:
                                "#777",
                            border:
                                "1px dashed #ccc",
                            borderRadius:
                                "8px",
                        }}
                    >

                        Chưa có dữ liệu.
                        <br />

                        Nhập từ khóa rồi bấm
                        <strong>
                            {" "}Tìm video
                        </strong>.

                    </div>

                )}


            {/* RESULTS */}

            {results.length > 0 && (

                <div>

                    <div
                        style={{
                            marginBottom:
                                "12px",
                            fontWeight:
                                "600",
                        }}
                    >

                        🎯 Tìm thấy{" "}
                        {results.length} video

                    </div>


                    <div
                        style={{
                            overflowX:
                                "auto",
                        }}
                    >

                        <table
                            style={{
                                width:
                                    "100%",
                                borderCollapse:
                                    "collapse",
                                fontSize:
                                    "14px",
                            }}
                        >

                            <thead>

                                <tr>

                                    <th
                                        style={thStyle}
                                    >
                                        Video
                                    </th>

                                    <th
                                        style={thStyle}
                                    >
                                        Kênh
                                    </th>

                                    <th
                                        style={thStyle}
                                    >
                                        Follow
                                    </th>

                                    <th
                                        style={thStyle}
                                    >
                                        View
                                    </th>

                                    <th
                                        style={thStyle}
                                    >
                                        Like
                                    </th>

                                    <th
                                        style={thStyle}
                                    >
                                        Comment
                                    </th>

                                    <th
                                        style={thStyle}
                                    >
                                        Thời lượng
                                    </th>

                                    <th
                                        style={thStyle}
                                    >
                                        Ngày đăng
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {results.map(
                                    (item) => (

                                        <tr
                                            key={
                                                item.videoId
                                            }
                                        >

                                            <td
                                                style={
                                                    tdStyle
                                                }
                                            >

                                                <a
                                                    href={
                                                        item.url
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    style={{
                                                        color:
                                                            "#1565c0",
                                                        fontWeight:
                                                            "600",
                                                        textDecoration:
                                                            "none",
                                                    }}
                                                >

                                                    {item.title}

                                                </a>

                                            </td>


                                            <td
                                                style={
                                                    tdStyle
                                                }
                                            >

                                                {
                                                    item.channelTitle
                                                }

                                            </td>


                                            <td
                                                style={
                                                    tdStyle
                                                }
                                            >

                                                {formatNumber(
                                                    item.subscribers
                                                )}

                                            </td>


                                            <td
                                                style={
                                                    tdStyle
                                                }
                                            >

                                                {formatNumber(
                                                    item.views
                                                )}

                                            </td>


                                            <td
                                                style={
                                                    tdStyle
                                                }
                                            >

                                                {formatNumber(
                                                    item.likes
                                                )}

                                            </td>


                                            <td
                                                style={
                                                    tdStyle
                                                }
                                            >

                                                {formatNumber(
                                                    item.comments
                                                )}

                                            </td>


                                            <td
                                                style={
                                                    tdStyle
                                                }
                                            >

                                                {formatDuration(
                                                    item.durationSeconds
                                                )}

                                            </td>


                                            <td
                                                style={
                                                    tdStyle
                                                }
                                            >

                                                {formatDate(
                                                    item.publishedAt
                                                )}

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                </div>

            )}

        </section>

    );

}


const thStyle = {

    textAlign:
        "left",

    padding:
        "10px",

    borderBottom:
        "2px solid #ddd",

    whiteSpace:
        "nowrap",

};


const tdStyle = {

    padding:
        "10px",

    borderBottom:
        "1px solid #eee",

    verticalAlign:
        "top",

};


export default YouTubeResearchPanel;