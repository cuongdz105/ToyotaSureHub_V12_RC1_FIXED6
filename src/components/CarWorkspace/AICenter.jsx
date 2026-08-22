function AICenter({
    car,

    onViewAI,

    onGenerateAll,

    onSalesChat,

}) {

    const ai = car.aiContent || {};

    const renderItem = (label, key) => (

        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
                padding: "8px 0",
                borderBottom: "1px solid #eee",
            }}
        >

            <span>
                {label}
                {ai[key] ? " ✅" : " ❌"}
            </span>

            {ai[key] && (
                <button onClick={() => onViewAI(key)}>
                    👁 Xem
                </button>
            )}

        </div>

    );

    return (

        <div className="ai-memory">

            <h3>🤖 Toyota AI Center</h3>

            <div
                style={{
                    display: "flex",
                    gap: 10,
                    margin: "15px 0",
                    flexWrap: "wrap",
                }}
            >

                <button onClick={onGenerateAll}>
                    🚀 Generate All
                </button>

                <button onClick={onSalesChat}>
                    💬 AI Sales
                </button>

            </div>

            <hr />

            {renderItem("📘 Facebook", "facebook")}

            {renderItem("🎬 TikTok", "tiktok")}

            {renderItem("▶️ YouTube", "youtube")}

            {renderItem("🌐 SEO", "seo")}

            {renderItem("🖼 Thumbnail", "thumbnail")}

        </div>

    );

}

export default AICenter;