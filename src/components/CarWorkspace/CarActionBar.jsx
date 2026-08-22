import "./CarActionBar.css";

function CarActionBar({
  onBack,
  onEdit,
  onDelete,
  onAI,
  onFacebook,
  onTikTok,
  onYoutube,
}) {
  return (
    <div className="action-bar">
      <button className="btn-back" onClick={onBack}>
        ⬅ Quay lại
      </button>

      <button className="btn-edit" onClick={onEdit}>
        ✏️ Sửa
      </button>

      <button className="btn-delete" onClick={onDelete}>
        🗑 Xóa
      </button>

      <button className="btn-ai" onClick={onAI}>
        🤖 Toyota AI
      </button>

      <button className="btn-facebook" onClick={onFacebook}>
        📣 Facebook
      </button>

      <button className="btn-tiktok" onClick={onTikTok}>
        🎬 TikTok
      </button>

      <button className="btn-youtube" onClick={onYoutube}>
        ▶️ YouTube
      </button>
    </div>
  );
}

export default CarActionBar;