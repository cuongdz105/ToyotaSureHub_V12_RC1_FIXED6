import { supabase } from "../lib/supabase";
import { getStoreState, setStoreData, insertStoreItem, patchStoreItem, removeStoreItem } from "./appDataStore";

export function loadAccounts() { return getStoreState().accounts; }

function payload(account) {
  return {
    name: account.name || "",
    status: account.status || "active",
    profile_url: account.profileUrl || "",
    notes: account.note || account.notes || "",
    metadata: {
      ...(account.metadata || {}),
      totalPosts: account.totalPosts || 0,
      isDefault: account.isDefault === true,
      allowAllGroups: account.allowAllGroups !== false,
      excludedGroupIds: account.excludedGroupIds || [],
      allowedGroupIds: account.allowedGroupIds || [],
      groups: account.groups || [],
    },
  };
}

export function saveAccounts(accounts) {
  setStoreData("accounts", accounts);
  return Promise.all(accounts.map(async (account) => {
    const { error } = await supabase.from("facebook_accounts").upsert({ id: account.id, ...payload(account) });
    if (error) throw error;
  }));
}

export function addAccount(account) {
  const current = loadAccounts();
  const newAccount = {
    id: account.id || crypto.randomUUID(),
    name: account.name || "",
    profileUrl: account.profileUrl || "",
    note: account.note || "",
    status: "active",
    createdAt: new Date().toISOString(),
    totalPosts: 0,
    isDefault: current.length === 0,
    allowAllGroups: true,
    excludedGroupIds: [],
    allowedGroupIds: [],
    groups: [],
    ...account,
  };
  insertStoreItem("accounts", newAccount);
  const { id, ...insertPayload } = payload(newAccount);
  const promise = supabase
    .from("facebook_accounts")
    .insert(insertPayload)
    .select("*")
    .single()
    .then(({ data, error }) => {
      if (error) {
        removeStoreItem("accounts", newAccount.id);
        throw error;
      }
      if (data?.id) {
        patchStoreItem("accounts", newAccount.id, () => ({
          ...newAccount,
          id: data.id,
        }));
      }
      return data;
    });
  return promise;
}

export function updateAccount(id, data) {
  const current = loadAccounts().find((item) => String(item.id) === String(id));
  if (!current) return null;
  const updated = { ...current, ...data };
  patchStoreItem("accounts", id, () => updated);
  return supabase.from("facebook_accounts").update(payload(updated)).eq("id", id).select("*").single().then(({ data: row, error }) => {
    if (error) throw error;
    return row;
  });
}

export function deleteAccount(id) {
  removeStoreItem("accounts", id);
  return supabase.from("facebook_accounts").delete().eq("id", id).then(({ error }) => { if (error) throw error; });
}

export function setDefaultAccount(id) {
  const accounts = loadAccounts().map((item) => ({ ...item, isDefault: String(item.id) === String(id) }));
  setStoreData("accounts", accounts);
  return saveAccounts(accounts).then(() => accounts.find((item) => String(item.id) === String(id)) || null);
}

export function getDefaultAccount() { return loadAccounts().find((item) => item.isDefault) || null; }

export function isAccountAllowedForGroup(account, group) {
  if (!account || !group) return false;
  if (account.status && account.status !== "active") return false;
  if (group.status && group.status !== "active") return false;
  if (group.allowPost === false) return false;
  const groupId = String(group.id);
  if (account.allowAllGroups !== false) {
    return !(account.excludedGroupIds || []).some((id) => String(id) === groupId);
  }
  return (account.allowedGroupIds || []).some((id) => String(id) === groupId);
}
