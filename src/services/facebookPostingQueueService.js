import { supabase } from "../lib/supabase";
import { getStoreState, setStoreData, insertStoreItem, patchStoreItem, removeStoreItem } from "./appDataStore";
import { isAccountAllowedForGroup, loadAccounts } from "./facebookAccountService";
import { logPostingReport } from "./reportService";

export function loadPostingQueue() { return getStoreState().queue; }

function rowFromJob(job) {
  const payload = {
    ...(job.payload || {}),
    logs: job.logs || [],
    account: job.account || null,
    group: job.group || null,
    content: job.content || "",
    imageCount: job.imageCount || 0,
    variation: job.variation || null,
    result: job.result || null,
    error: job.error || null,
  };
  return {
    campaign_id: job.campaignId || null,
    car_id: job.carId || null,
    group_id: job.groupId || job.group?.id || null,
    account_id: job.accountId || job.account?.id || null,
    status: job.status || "pending",
    scheduled_at: job.scheduledAt || null,
    attempts: job.attempts || 0,
    error_reason: job.errorReason || "",
    payload,
  };
}

function persist(job) {
  return supabase.from("facebook_queue").update(rowFromJob(job)).eq("id", job.id).select("*").single().then(({ data, error }) => {
    if (error) throw error;
    return { id: data.id, ...data.payload, campaignId: data.campaign_id, carId: data.car_id, groupId: data.group_id, accountId: data.account_id, status: data.status, scheduledAt: data.scheduled_at, attempts: data.attempts, errorReason: data.error_reason, createdAt: data.created_at, updatedAt: data.updated_at };
  });
}

export function savePostingQueue(queue) {
  setStoreData("queue", queue);
  return Promise.all(queue.map((job) => persist(job)));
}

export function addToPostingQueue({ campaignId = null, carId, group, content, imageCount = 0, accountId = null, variation = null }) {
  if (!group) throw new Error("Chưa chọn hội nhóm.");
  if (!content?.trim()) throw new Error("Nội dung Facebook đang trống.");
  if (!imageCount || imageCount <= 0) throw new Error("Bài đăng chưa có ảnh.");
  const account = loadAccounts().find((item) => String(item.id) === String(accountId)) || loadAccounts().find((item) => item.isDefault) || loadAccounts()[0];
  if (!account) throw new Error("Chưa có tài khoản Facebook.");
  if (!isAccountAllowedForGroup(account, group)) throw new Error("Tài khoản Facebook không được phép đăng vào nhóm này.");
  const now = new Date().toISOString();
  const job = {
    id: crypto.randomUUID(),
    campaignId: campaignId || null,
    carId: carId || null,
    groupId: group.id,
    accountId: account.id,
    status: "pending",
    createdAt: now,
    updatedAt: now,
    scheduledAt: null,
    attempts: 0,
    errorReason: "",
    logs: [
      { message: "📋 Bài đăng được thêm vào Queue", timestamp: now },
      { message: `👤 Tài khoản: ${account.name}`, timestamp: now },
      { message: `👥 Nhóm: ${group.name}`, timestamp: now },
    ],
    account: { ...account },
    group: { ...group },
    content,
    imageCount,
    variation,
  };
  insertStoreItem("queue", job);
  const { id, ...payload } = rowFromJob(job);
  return supabase
    .from("facebook_queue")
    .insert(payload)
    .select("*")
    .single()
    .then(({ data, error }) => {
      if (error) {
        removeStoreItem("queue", job.id);
        throw error;
      }
      patchStoreItem("queue", job.id, () => ({ ...job, id: data.id }));
      return { ...job, id: data.id };
    });
}

export function updateQueueJob(jobId, updates = {}) {
  const current = loadPostingQueue().find((job) => String(job.id) === String(jobId));
  if (!current) throw new Error("Không tìm thấy Queue Job.");
  const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
  patchStoreItem("queue", jobId, () => updated);
  return persist(updated);
}

export function prepareManualPostingJob(jobId) {
  return updateQueueJob(jobId, { status: "manual_ready" });
}

export async function confirmManualPosted(jobId, result = {}) {
  const job = loadPostingQueue().find((item) => String(item.id) === String(jobId));

  const updated = await updateQueueJob(jobId, {
    status: "success",
    result: {
      ...result,
      completedAt: new Date().toISOString(),
      confirmedByUser: true,
    },
  });

  if (job) {
    const car = getStoreState().cars.find(
      (item) => String(item.id) === String(job.carId)
    );

    if (car) {
      logPostingReport({ job, car }).catch((error) => {
        console.error("Lỗi ghi báo cáo đăng bài:", error);
      });
    }
  }

  return updated;
}

export function cancelManualPostingJob(jobId) { return updateQueueJob(jobId, { status: "cancelled" }); }

export function addQueueLog(jobId, log) {
  const current = loadPostingQueue().find((job) => String(job.id) === String(jobId));
  if (!current) return null;
  const logs = [...(current.logs || []), { ...log, timestamp: log.timestamp || new Date().toISOString() }];
  return updateQueueJob(jobId, { logs });
}

export function removeQueueJob(jobId) {
  removeStoreItem("queue", jobId);
  void supabase.from("facebook_queue").delete().eq("id", jobId).then(({ error }) => { if (error) console.error("Queue delete error:", error); });
  return true;
}

export async function deleteQueueJobsByCarId(carId) {
  const jobs = loadPostingQueue().filter(
    (job) => String(job.carId) === String(carId)
  );

  if (!jobs.length) {
    return 0;
  }

  const { error } = await supabase
    .from("facebook_queue")
    .delete()
    .eq("car_id", carId);

  if (error) {
    throw error;
  }

  setStoreData(
    "queue",
    loadPostingQueue().filter(
      (job) => String(job.carId) !== String(carId)
    )
  );

  return jobs.length;
}

export function clearPostingQueue() {
  setStoreData("queue", []);
  void supabase.from("facebook_queue").delete().neq("id", "00000000-0000-0000-0000-000000000000").then(({ error }) => { if (error) console.error("Queue clear error:", error); });
}

export function getQueueStats() {
  const queue = loadPostingQueue();
  return {
    total: queue.length,
    waiting: queue.filter((job) => job.status === "pending").length,
    processing: queue.filter((job) => ["running", "processing"].includes(job.status)).length,
    manualReady: queue.filter((job) => job.status === "manual_ready").length,
    success: queue.filter((job) => job.status === "success").length,
    failed: queue.filter((job) => job.status === "failed").length,
  };
}

export function getCampaignJobs(campaignId) { return loadPostingQueue().filter((job) => String(job.campaignId) === String(campaignId)); }
export function getCampaignQueueStats(campaignId) {
  const jobs = getCampaignJobs(campaignId);
  return { total: jobs.length, pending: jobs.filter((j) => j.status === "pending").length, success: jobs.filter((j) => j.status === "success").length, failed: jobs.filter((j) => j.status === "failed").length };
}