import "./AIResultModal.css";

function AIResultModal({
    open,
    title,
    content,
    loading,
    onClose,
    onCopy,
    onCopyAll,
    onDownload,
    onRegenerate,
})

{
  if (!open) return null;

  return (
    <div className="ai-overlay">
      <div className="ai-modal">

        <div className="ai-header">
          <h2>🤖 {title}</h2>
        </div>

        <div className="ai-body">

          {loading ? (

            <div className="ai-loading">

              <div className="spinner"></div>

              <p>Toyota AI đang suy nghĩ...</p>

            </div>

          ) : (

            <pre>{content}</pre>

          )}

        </div>

        <div className="ai-footer">

          {!loading && (
  <>
    <button onClick={onCopy}>
      📋 Copy
    </button>

     <button onClick={onCopyAll}>
    📚 Copy All
</button>

    <button onClick={onDownload}>
      💾 Download
    </button>

    <button onClick={onRegenerate}>
      🔄 Tạo lại
    </button>
  </>
)}

<button onClick={onClose}>
  ❌ Đóng
</button>

        </div>

      </div>
    </div>
  );
}

export default AIResultModal;