import { getStoreState, setStoreData } from "../services/appDataStore";
import { supabase } from "../lib/supabase";
import { refreshCars } from "../services/carService";

function Settings() {
  async function handleBackup() {
    const state = getStoreState();
    const data = JSON.stringify({ cars: state.cars, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ToyotaSureHub_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    alert("✅ Đã xuất backup dữ liệu xe từ Supabase.");
  }

  async function handleRestore(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const cars = Array.isArray(parsed) ? parsed : parsed.cars;
      if (!Array.isArray(cars)) throw new Error("File không chứa danh sách xe.");
      for (const car of cars) {
        const { id, createdAt, updatedAt, images, ...payload } = car;
        const { error } = await supabase.from("cars").upsert({ id, ...payload, sold_at: car.soldAt || null, metadata: car.metadata || {} });
        if (error) throw error;
      }
      await refreshCars();
      alert("✅ Đã khôi phục dữ liệu xe vào Supabase.");
      window.location.href = "/cars";
    } catch (error) {
      alert(`❌ Không thể khôi phục: ${error.message || error}`);
    } finally {
      e.target.value = "";
    }
  }

  async function handleClear() {
    if (!window.confirm("Ông có chắc chắn muốn xóa toàn bộ xe khỏi Supabase không?")) return;
    const { error } = await supabase.from("cars").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) { alert(`❌ Không thể xóa: ${error.message}`); return; }
    setStoreData("cars", []);
    alert("🗑️ Đã xóa toàn bộ xe khỏi Supabase.");
    window.location.href = "/cars";
  }

  return (
    <div className="app">
      <main className="content">
        <h1>⚙️ Cài đặt</h1>
        <div className="form-container">
          <button className="save-btn" onClick={handleBackup}>💾 Backup dữ liệu xe</button>
          <input type="file" id="restoreFile" accept=".json" style={{ display: "none" }} onChange={handleRestore} />
          <button className="save-btn" style={{ marginTop: 15 }} onClick={() => document.getElementById("restoreFile")?.click()}>📂 Khôi phục dữ liệu xe</button>
          <button className="save-btn" style={{ marginTop: 15, background: "#dc2626" }} onClick={handleClear}>🗑️ Xóa toàn bộ dữ liệu xe</button>
        </div>
      </main>
    </div>
  );
}

export default Settings;
