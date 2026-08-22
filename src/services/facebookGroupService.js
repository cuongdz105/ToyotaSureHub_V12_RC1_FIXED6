import { supabase } from "../lib/supabase";
import { getStoreState, setStoreData, insertStoreItem, patchStoreItem, removeStoreItem } from "./appDataStore";

export function loadGroups() { return getStoreState().groups; }

function payload(group) {
  return {
    name: group.name || "",
    group_url: group.url || group.groupUrl || "",
    group_id: group.facebookGroupId || group.groupId || null,
    status: group.status || "active",
    notes: group.notes || "",
    metadata: {
      ...(group.metadata || {}),
      rating: group.rating ?? 5,
      allowPost: group.allowPost !== false,
      requireApproval: group.requireApproval === true,
      suitableCars: group.suitableCars || [],
      accountIds: group.accountIds || [],
      members: group.members || "",
      category: group.category || "",
      totalPosts: group.totalPosts || 0,
      lastPostAt: group.lastPostAt || null,
    },
  };
}

export function saveGroups(groups) {
  setStoreData("groups", groups);
  return Promise.all(groups.map(async (group) => {
    const { error } = await supabase.from("facebook_groups").upsert({ id: group.id, ...payload(group) });
    if (error) throw error;
  }));
}

export function addGroup(group) {
  const newGroup = {
    id: group.id || crypto.randomUUID(),
    name: "",
    url: "",
    status: "active",
    rating: 5,
    allowPost: true,
    requireApproval: false,
    suitableCars: [],
    accountIds: [],
    notes: "",
    members: "",
    category: "",
    totalPosts: 0,
    lastPostAt: null,
    ...group,
  };
  insertStoreItem("groups", newGroup);
  const { id, ...insertPayload } = payload(newGroup);
  return supabase
    .from("facebook_groups")
    .insert(insertPayload)
    .select("*")
    .single()
    .then(({ data, error }) => {
      if (error) {
        removeStoreItem("groups", newGroup.id);
        throw error;
      }
      if (data?.id) {
        patchStoreItem("groups", newGroup.id, () => ({
          ...newGroup,
          id: data.id,
        }));
      }
      return data;
    });
}

export function updateGroup(id, data) {
  const current = loadGroups().find((item) => String(item.id) === String(id));
  if (!current) return null;
  const updated = { ...current, ...data };
  patchStoreItem("groups", id, () => updated);
  return supabase.from("facebook_groups").update(payload(updated)).eq("id", id).select("*").single().then(({ data: row, error }) => {
    if (error) throw error;
    return row;
  });
}

export function deleteGroup(id) {
  removeStoreItem("groups", id);
  return supabase.from("facebook_groups").delete().eq("id", id).then(({ error }) => { if (error) throw error; });
}
