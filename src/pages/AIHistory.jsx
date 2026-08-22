import { useEffect, useState } from "react";
import { getStoreState, setStoreData } from "../services/appDataStore";
import { loadHistoryFromSupabase, clearHistory } from "../ai/history/historyService";

function AIHistory() {
  const [history, setHistory] = useState(getStoreState().aiHistory || []);

  useEffect(() => {
    loadHistoryFromSupabase()
      .then((data) => {
        setStoreData("aiHistory", data);
        setHistory(data);
      })
      .catch((error) => console.error("AI History load error:", error));
  }, []);

  async function handleClear() {
    if (!window.confirm("Xóa toàn bộ lịch sử AI?")) return;
    await clearHistory();
    setStoreData("aiHistory", []);
    setHistory([]);
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>🤖 Toyota AI History</h1>
      <p style={{ color: "#777" }}>Tự động giữ lịch sử trong 90 ngày.</p>
      <button onClick={handleClear}>🗑️ Xóa lịch sử</button>
      <hr />
      {history.length === 0 ? <p>Chưa có dữ liệu.</p> : history.map((item) => (
        <div key={item.id} style={{ border: "1px solid #ddd", padding: 15, marginBottom: 15, borderRadius: 10 }}>
          <h3>{item.title || item.feature || "AI"}</h3>
          <p><b>Xe:</b> {item.car || item.carId || "-"}</p>
          <p><b>Loại:</b> {item.type || item.feature || "-"}</p>
          <pre>{item.content || item.result || ""}</pre>
        </div>
      ))}
    </div>
  );
}

export default AIHistory;
