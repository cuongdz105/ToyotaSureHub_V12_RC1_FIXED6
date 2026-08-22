import { useSyncExternalStore } from "react";
import { getStoreSnapshot, subscribe } from "../services/appDataStore";

export function useCars() {
  const snapshot = useSyncExternalStore(subscribe, getStoreSnapshot, getStoreSnapshot);
  return {
    cars: snapshot.cars,
    loading: snapshot.loading,
  };
}
