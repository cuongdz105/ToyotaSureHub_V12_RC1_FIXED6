import { supabase } from "../lib/supabase";
import { getStoreState, setStoreData, insertStoreItem, patchStoreItem, removeStoreItem } from "./appDataStore";
import { loadPostingQueue } from "./facebookPostingQueueService";

export function loadCampaigns() { return getStoreState().campaigns; }

function rowFromCampaign(campaign) {
  return {
    name: campaign.name || campaign.type || "Facebook Campaign",
    car_id: campaign.carId || null,
    status: campaign.status || "draft",
    campaign_type: campaign.campaignType || campaign.type || "facebook_group_campaign",
    content: campaign.content || campaign.contentPreview || "",
    hashtags: Array.isArray(campaign.hashtags) ? campaign.hashtags : [],
    scheduled_at: campaign.scheduledAt || campaign.scheduled_at || null,
    notes: campaign.notes || "",
    metadata: {
      ...(campaign.metadata || {}),
      version: campaign.version || 2,
      accountId: campaign.accountId || null,
      accountSnapshot: campaign.accountSnapshot || null,
      selectedGroupIds: campaign.selectedGroupIds || [],
      groupSnapshots: campaign.groupSnapshots || [],
      carSnapshot: campaign.carSnapshot || null,
      imageCount: campaign.imageCount || 0,
      variationPlan: campaign.variationPlan || [],
      jobIds: campaign.jobIds || [],
      totalJobs: campaign.totalJobs || 0,
      waitingJobs: campaign.waitingJobs || 0,
      completedJobs: campaign.completedJobs || 0,
      failedJobs: campaign.failedJobs || 0,
      createdAt: campaign.createdAt || null,
      updatedAt: campaign.updatedAt || null,
      ...campaign.metadata,
    },
  };
}

function mapRow(row) {
  return {
    id: row.id,
    name: row.name || "",
    carId: row.car_id || null,
    status: row.status || "draft",
    campaignType: row.campaign_type || "",
    type: row.campaign_type || "",
    content: row.content || "",
    contentPreview: row.content ? row.content.slice(0, 500) : "",
    hashtags: row.hashtags || [],
    scheduledAt: row.scheduled_at || null,
    notes: row.notes || "",
    createdAt: row.created_at || row.metadata?.createdAt || null,
    updatedAt: row.updated_at || row.metadata?.updatedAt || null,
    ...row.metadata,
  };
}

function persist(campaign) {
  return supabase.from("facebook_campaigns").update(rowFromCampaign(campaign)).eq("id", campaign.id).select("*").single().then(({ data, error }) => {
    if (error) throw error;
    return mapRow(data);
  });
}

export async function createCampaign({ car, account, selectedGroups = [], content = "", imageCount = 0, variationPlan = [], scheduledAt = null }) {
  if (!car?.id) throw new Error("Campaign chưa có xe.");
  if (!account?.id) throw new Error("Campaign chưa có tài khoản Facebook.");
  if (!selectedGroups.length) throw new Error("Campaign chưa có nhóm Facebook.");
  const campaign = {
    id: crypto.randomUUID(),
    name: `${car.brand || ""} ${car.model || ""}`.trim(),
    version: 2,
    type: "facebook_group_campaign",
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    scheduledAt,
    carId: car.id,
    accountId: account.id,
    selectedGroupIds: selectedGroups.map((group) => group.id),
    content,
    contentPreview: String(content).slice(0, 500),
    carSnapshot: { ...car, images: undefined },
    accountSnapshot: { ...account },
    groupSnapshots: selectedGroups.map((group) => ({ ...group })),
    imageCount,
    variationPlan,
    jobIds: [],
    totalJobs: 0,
    waitingJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
  };
  insertStoreItem("campaigns", campaign);
  const { id, ...insertPayload } = rowFromCampaign(campaign);
  const { data, error } = await supabase
    .from("facebook_campaigns")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    removeStoreItem("campaigns", campaign.id);
    throw error;
  }

  const saved = mapRow(data);
  patchStoreItem("campaigns", campaign.id, () => saved);
  return saved;
}

export function getCampaign(campaignId) {
  return loadCampaigns().find((campaign) => String(campaign.id) === String(campaignId)) || null;
}

export function updateCampaign(campaignId, updates = {}) {
  const current = getCampaign(campaignId);
  if (!current) throw new Error("Không tìm thấy Campaign.");
  const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
  patchStoreItem("campaigns", campaignId, () => updated);
  return persist(updated);
}

export async function attachCampaignJobs(campaignId, jobIds = []) {
  const campaign = getCampaign(campaignId);
  if (!campaign) throw new Error("Không tìm thấy Campaign.");
  const merged = Array.from(new Set([...(campaign.jobIds || []), ...jobIds]));
  return updateCampaign(campaignId, { jobIds: merged, totalJobs: merged.length, waitingJobs: merged.length });
}

export async function setCampaignStatus(campaignId, status) {
  const allowed = ["draft", "queued", "running", "paused", "completed", "failed", "cancelled"];
  if (!allowed.includes(status)) throw new Error("Trạng thái Campaign không hợp lệ.");
  return updateCampaign(campaignId, { status });
}

export function syncCampaignProgress(campaignId) {
  const campaign = getCampaign(campaignId);
  if (!campaign) return null;
  const jobs = loadPostingQueue().filter((job) => String(job.campaignId) === String(campaignId));
  const completedJobs = jobs.filter((job) => job.status === "success").length;
  const failedJobs = jobs.filter((job) => job.status === "failed").length;
  const waitingJobs = jobs.filter((job) => !["success", "failed", "cancelled"].includes(job.status)).length;
  const status = jobs.length && completedJobs === jobs.length ? "completed" : campaign.status;
  return updateCampaign(campaignId, { totalJobs: jobs.length, completedJobs, failedJobs, waitingJobs, status });
}

export function deleteCampaign(campaignId) {
  removeStoreItem("campaigns", campaignId);
  return supabase.from("facebook_campaigns").delete().eq("id", campaignId).then(({ error }) => { if (error) throw error; });
}

export async function deleteCampaignsByCarId(carId) {
  const ids = loadCampaigns()
    .filter((item) => String(item.carId) === String(carId))
    .map((item) => item.id);

  if (!ids.length) {
    return 0;
  }

  const { error } = await supabase
    .from("facebook_campaigns")
    .delete()
    .eq("car_id", carId);

  if (error) {
    throw error;
  }

  setStoreData(
    "campaigns",
    loadCampaigns().filter(
      (item) => String(item.carId) !== String(carId)
    )
  );

  return ids.length;
}

export function clearCampaigns() {
  setStoreData("campaigns", []);
  void supabase.from("facebook_campaigns").delete().neq("id", "00000000-0000-0000-0000-000000000000").then(({ error }) => { if (error) console.error("Campaign clear error:", error); });
}

export const FACEBOOK_CAMPAIGN_STORAGE_KEY = "supabase:facebook_campaigns";
