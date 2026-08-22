import "./PlatformCard.css";

function PlatformCard({
    icon,
    title,
    generated,
    published,
    onView,
    onPublish,
}) {

    return (
        <div className="platform-card">

            <div className="platform-header">
                <h3>
                    {icon} {title}
                </h3>
            </div>

            <div className="platform-status">

                <p>
                    {generated
                        ? "🟢 AI Ready"
                        : "⚪ Chưa tạo AI"}
                </p>

                <p>
                    {published
                        ? "🟢 Published"
                        : "🟡 Draft"}
                </p>

            </div>

            <div className="platform-actions">

                <button onClick={onView}>
                    👁 Xem
                </button>

                <button onClick={onPublish}>
                    🚀 Publish
                </button>

            </div>

        </div>
    );

}

export default PlatformCard;