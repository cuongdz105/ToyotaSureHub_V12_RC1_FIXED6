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
      <button className="btn-ai" onClick={onAI}>
        🤖 Toyota AI
      </button>
    </div>
  );
}

export default CarActionBar;