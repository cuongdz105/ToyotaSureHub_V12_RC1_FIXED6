function AIMemory({ ai = {}, onViewAI }) {
  return (
    <div className="ai-memory">

      <h3>🤖 AI Memory</h3>

      <p>
        📘 Facebook:
        {ai.facebook ? " ✅ Đã tạo" : " ❌ Chưa có"}
        {ai.facebook && (
          <button onClick={() => onViewAI("facebook")}>
            👁 Xem
          </button>
        )}
      </p>

      <p>
        🎬 TikTok:
        {ai.tiktok ? " ✅ Đã tạo" : " ❌ Chưa có"}
        {ai.tiktok && (
          <button onClick={() => onViewAI("tiktok")}>
            👁 Xem
          </button>
        )}
      </p>

      <p>
        ▶️ YouTube:
        {ai.youtube ? " ✅ Đã tạo" : " ❌ Chưa có"}
        {ai.youtube && (
          <button onClick={() => onViewAI("youtube")}>
            👁 Xem
          </button>
        )}
      </p>

      <p>
        🌐 SEO:
        {ai.seo ? " ✅ Đã tạo" : " ❌ Chưa có"}
        {ai.seo && (
          <button onClick={() => onViewAI("seo")}>
            👁 Xem
          </button>
        )}
      </p>

      <p>
        🖼 Thumbnail:
        {ai.thumbnail ? " ✅ Đã tạo" : " ❌ Chưa có"}
        {ai.thumbnail && (
          <button onClick={() => onViewAI("thumbnail")}>
            👁 Xem
          </button>
        )}
      </p>

    </div>
  );
}

export default AIMemory;