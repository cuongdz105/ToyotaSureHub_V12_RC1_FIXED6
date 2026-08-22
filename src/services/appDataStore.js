import { supabase } from "../lib/supabase";

const state = {
  cars: [],
  accounts: [],
  groups: [],
  campaigns: [],
  queue: [],
  customers: [],
  aiHistory: [],
  initialized: false,
  loading: false,
};

const listeners = new Set();
let snapshot = { ...state };

function emit() {
  snapshot = { ...state };
  listeners.forEach((listener) => listener());
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getStoreState() {
  return state;
}

export function getStoreSnapshot() {
  return snapshot;
}

export function setStoreData(key, value) {
  state[key] = Array.isArray(value) ? value : value || [];
  emit();
}

export function patchStoreItem(key, id, updater) {
  state[key] = state[key].map((item) =>
    String(item.id) === String(id) ? updater(item) : item
  );
  emit();
}

export function insertStoreItem(key, item, prepend = true) {
  state[key] = prepend ? [item, ...state[key]] : [...state[key], item];
  emit();
}

export function removeStoreItem(key, id) {
  state[key] = state[key].filter(
    (item) => String(item.id) !== String(id)
  );
  emit();
}

function mapAccount(row) {
  return {
    id: row.id,
    name: row.name || "",
    status: row.status || "active",
    profileUrl: row.profile_url || "",
    note: row.notes || "",
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
    totalPosts: row.metadata?.totalPosts || 0,
    isDefault: row.metadata?.isDefault === true,
    allowAllGroups: row.metadata?.allowAllGroups !== false,
    excludedGroupIds: row.metadata?.excludedGroupIds || [],
    allowedGroupIds: row.metadata?.allowedGroupIds || [],
    groups: row.metadata?.groups || [],
    metadata: row.metadata || {},
  };
}

function mapGroup(row) {
  return {
    id: row.id,
    name: row.name || "",
    url: row.group_url || "",
    facebookGroupId: row.group_id || "",
    status: row.status || "active",
    notes: row.notes || "",
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
    rating: row.metadata?.rating ?? 5,
    allowPost: row.metadata?.allowPost !== false,
    requireApproval: row.metadata?.requireApproval === true,
    suitableCars: row.metadata?.suitableCars || [],
    accountIds: row.metadata?.accountIds || [],
    members: row.metadata?.members || "",
    category: row.metadata?.category || "",
    totalPosts: row.metadata?.totalPosts || 0,
    lastPostAt: row.metadata?.lastPostAt || null,
    metadata: row.metadata || {},
  };
}

function mapCampaign(row) {
  return {
    id: row.id,
    name: row.name || "",
    carId: row.car_id || null,
    status: row.status || "draft",
    campaignType: row.campaign_type || "",
    content: row.content || "",
    hashtags: row.hashtags || [],
    scheduledAt: row.scheduled_at || null,
    notes: row.notes || "",
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
    ...row.metadata,
  };
}

function mapQueue(row) {
  return {
    id: row.id,
    campaignId: row.campaign_id || null,
    carId: row.car_id || null,
    groupId: row.group_id || null,
    accountId: row.account_id || null,
    status: row.status || "pending",
    scheduledAt: row.scheduled_at || null,
    attempts: row.attempts || 0,
    errorReason: row.error_reason || "",
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
    ...(row.payload || {}),
  };
}

function mapCustomer(row) {
  return {
    id: row.id,
    name: row.name || "",
    phone: row.phone || "",
    zalo: row.zalo || "",
    source: row.source || "",
    status: row.status || "new",
    notes: row.notes || "",
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
    ...(row.metadata || {}),
  };
}

function mapAIHistory(row) {
  return {
    id: row.id,
    carId: row.car_id || null,
    feature: row.feature || "",
    provider: row.provider || "",
    prompt: row.prompt || "",
    result: row.result || "",
    createdAt: row.created_at || null,
    ...(row.metadata || {}),
  };
}

async function fetchTable(table, mapper) {
  const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapper);
}

export async function initializeAppData() {
  if (state.initialized || state.loading) return;
  state.loading = true;
  emit();
  try {
    const results = await Promise.allSettled([
      import("./carSupabaseService").then(({ getCarsFromSupabase }) => getCarsFromSupabase()),
      fetchTable("facebook_accounts", mapAccount),
      fetchTable("facebook_groups", mapGroup),
      fetchTable("facebook_campaigns", mapCampaign),
      fetchTable("facebook_queue", mapQueue),
      fetchTable("customers", mapCustomer),
      fetchTable("ai_history", mapAIHistory),
    ]);
    const keys = ["cars", "accounts", "groups", "campaigns", "queue", "customers", "aiHistory"];
    results.forEach((result, index) => {
      if (result.status === "fulfilled") state[keys[index]] = result.value;
      else console.error(`ToyotaSureHub: failed to load ${keys[index]}`, result.reason);
    });
    state.initialized = true;
  } finally {
    state.loading = false;
    state.initialized = true;
    emit();
  }
}


export function resetStore() {
  state.cars = [];
  state.accounts = [];
  state.groups = [];
  state.campaigns = [];
  state.queue = [];
  state.customers = [];
  state.aiHistory = [];
  state.initialized = false;
  emit();
}

export {
  mapAccount,
  mapGroup,
  mapCampaign,
  mapQueue,
  mapCustomer,
  mapAIHistory,
};
