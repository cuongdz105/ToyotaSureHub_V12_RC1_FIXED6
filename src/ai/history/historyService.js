import { supabase } from "../../lib/supabase";

const RETENTION_DAYS = 90;

function mapRow(row) {
  return {
    id: row.id,
    carId: row.car_id || null,
    feature: row.feature || "",
    provider: row.provider || "",
    prompt: row.prompt || "",
    result: row.result || "",
    createdAt: row.created_at,
    ...(row.metadata || {}),
  };
}

export function loadHistory() {
  return [];
}

export async function loadHistoryFromSupabase() {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86400000).toISOString();
  const { data, error } = await supabase.from("ai_history").select("*").gte("created_at", cutoff).order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapRow);
}

export async function saveHistory(item) {
  const { data, error } = await supabase.from("ai_history").insert({
    car_id: item.carId || null,
    feature: item.feature || "",
    provider: item.provider || "",
    prompt: item.prompt || "",
    result: typeof item.result === "string" ? item.result : JSON.stringify(item.result ?? ""),
    metadata: { ...item },
  }).select("*").single();
  if (error) throw error;
  void purgeOldHistory();
  return mapRow(data);
}

export async function purgeOldHistory() {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86400000).toISOString();
  const { error } = await supabase.from("ai_history").delete().lt("created_at", cutoff);
  if (error) console.error("AI history cleanup error:", error);
}

export async function clearHistory() {
  const { error } = await supabase.from("ai_history").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) throw error;
}

export { RETENTION_DAYS };
