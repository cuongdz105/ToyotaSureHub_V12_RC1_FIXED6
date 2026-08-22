import "../styles/AIMenu.css";

function AIMenu({

    open,

    onClose,

    onGenerateAll,

    onFacebook,

    onYoutubeScript,

    onYoutubePost,

    onTikTokScript,

    onTikTokPost,

    onSEO,

    onThumbnail,

}) {

    if (!open) return null;

    return (

        <div className="modal-overlay">

            <div className="modal">

                <h2>🤖 Toyota AI</h2>


                {/* =================================
                    GENERATE ALL
                ================================= */}

                <div
                    className="ai-card"
                    onClick={onGenerateAll}
                >

                    <h3>
                        🚀 Generate All
                    </h3>

                    <p>
                        Tạo toàn bộ nội dung AI
                        cho chiếc xe.
                    </p>

                </div>


                {/* =================================
                    FACEBOOK
                ================================= */}

                <div
                    className="ai-card"
                    onClick={onFacebook}
                >

                    <h3>
                        📱 Facebook
                    </h3>

                    <p>
                        Viết bài bán xe
                        chuẩn hội nhóm.
                    </p>

                </div>


                {/* =================================
                    YOUTUBE
                ================================= */}

                <div className="ai-card">

                    <h3>
                        🎥 YouTube
                    </h3>

                    <p>
                        Chọn loại nội dung
                        cần tạo.
                    </p>


                    <div
                        style={{
                            display: "flex",
                            gap: "8px",
                            marginTop: "10px",
                            flexWrap: "wrap",
                        }}
                    >

                        <button
                            type="button"
                            onClick={(event) => {

                                event.stopPropagation();

                                onYoutubeScript();

                            }}
                            style={{
                                flex: 1,
                                minWidth: "150px",
                                padding: "10px",
                                border: "1px solid #ddd",
                                borderRadius: "8px",
                                background: "#fff",
                                cursor: "pointer",
                                fontWeight: 600,
                            }}
                        >

                            🎬 Kịch bản quay

                        </button>


                        <button
                            type="button"
                            onClick={(event) => {

                                event.stopPropagation();

                                onYoutubePost();

                            }}
                            style={{
                                flex: 1,
                                minWidth: "150px",
                                padding: "10px",
                                border: "1px solid #ddd",
                                borderRadius: "8px",
                                background: "#fff",
                                cursor: "pointer",
                                fontWeight: 600,
                            }}
                        >

                            📝 Nội dung đăng

                        </button>

                    </div>

                </div>


                {/* =================================
                    TIKTOK
                ================================= */}

                <div className="ai-card">

                    <h3>
                        🎵 TikTok
                    </h3>

                    <p>
                        Chọn loại nội dung
                        cần tạo.
                    </p>


                    <div
                        style={{
                            display: "flex",
                            gap: "8px",
                            marginTop: "10px",
                            flexWrap: "wrap",
                        }}
                    >

                        <button
                            type="button"
                            onClick={(event) => {

                                event.stopPropagation();

                                onTikTokScript();

                            }}
                            style={{
                                flex: 1,
                                minWidth: "150px",
                                padding: "10px",
                                border: "1px solid #ddd",
                                borderRadius: "8px",
                                background: "#fff",
                                cursor: "pointer",
                                fontWeight: 600,
                            }}
                        >

                            🎬 Kịch bản quay

                        </button>


                        <button
                            type="button"
                            onClick={(event) => {

                                event.stopPropagation();

                                onTikTokPost();

                            }}
                            style={{
                                flex: 1,
                                minWidth: "150px",
                                padding: "10px",
                                border: "1px solid #ddd",
                                borderRadius: "8px",
                                background: "#fff",
                                cursor: "pointer",
                                fontWeight: 600,
                            }}
                        >

                            📝 Nội dung đăng

                        </button>

                    </div>

                </div>


                {/* =================================
                    SEO
                ================================= */}

                <div
                    className="ai-card"
                    onClick={onSEO}
                >

                    <h3>
                        📰 SEO
                    </h3>

                    <p>
                        Bài viết chuẩn Google.
                    </p>

                </div>


                {/* =================================
                    THUMBNAIL
                ================================= */}

                <div
                    className="ai-card"
                    onClick={onThumbnail}
                >

                    <h3>
                        🖼 Thumbnail
                    </h3>

                    <p>
                        Tiêu đề thumbnail
                        tăng CTR.
                    </p>

                </div>


                <br />


                <button
                    type="button"
                    onClick={onClose}
                >
                    Đóng
                </button>

            </div>

        </div>

    );

}

export default AIMenu;