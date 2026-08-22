import { useEffect, useSyncExternalStore } from "react";
import { initializeAppData, getStoreSnapshot, subscribe } from "../services/appDataStore";

export default function AppDataProvider({ children }) {
  const snapshot = useSyncExternalStore(subscribe, getStoreSnapshot, getStoreSnapshot);

  useEffect(() => {
    initializeAppData().catch((error) => {
      console.error("ToyotaSureHub data initialization error:", error);
    });
  }, []);

  if (!snapshot.initialized) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#666" }}>
        ⏳ Đang đồng bộ dữ liệu ToyotaSureHub...
      </div>
    );
  }

  return children;
}
