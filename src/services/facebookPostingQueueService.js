import { supabase } from "../lib/supabase";
import { getStoreState, setStoreData, insertStoreItem, patchStoreItem, removeStoreItem } from "./appDataStore";
import { isAccountAllowedForGroup, loadAccounts } from "./facebookAccountService";
import { logPostingReport } from "./reportService";

export function loadPostingQueue() { return getStoreState().queue; }

function normalizeTarget(type) {
  return type === "profile" || type === "page" ? type : "group";
}

function rowFromJob(job) {
  const payload = {
    ...(job.payload || {}),
    logs: job.logs || [],
    account: job.account || null,
    group: job.group || null,
    content: job.content || "",
    imageCount: job.imageCount || 0,
    imageUrls: Array.isArray(job.imageUrls) ? job.imageUrls : [],
    targetType: normalizeTarget(job.targetType),
    variation: job.variation || null,
    result: job.result || null,
    error: job.error || null,
  };
  return {
    campaign_id: job.campaignId || null,
    car_id: job.carId || null,
    group_id: normalizeTarget(job.targetType) !== "group" ? null : (job.groupId || job.group?.id || null),
    account_id: job.accountId || job.account?.id || null,
    target_type: normalizeTarget(job.targetType),
    status: job.status || "pending",
    scheduled_at: job.scheduledAt || null,
    attempts: job.attempts || 0,
    error_reason: job.errorReason || "",
    payload,
  };
}

function jobFromRow(data) {
  return { id: data.id, ...data.payload, campaignId: data.campaign_id, carId: data.car_id, groupId: data.group_id, accountId: data.account_id, targetType: data.target_type || data.payload?.targetType || "group", status: data.status, scheduledAt: data.scheduled_at, attempts: data.attempts, errorReason: data.error_reason, createdAt: data.created_at, updatedAt: data.updated_at };
}

export function isProfileJob(job) {
  return job?.targetType === "profile";
}

export function isPageJob(job) {
  return job?.targetType === "page";
}

// Tên đích đăng để hiển thị: tên nhóm, "Tường cá nhân" hoặc "Fanpage"
export function getJobTargetName(job) {
  if (isProfileJob(job)) return `🧱 Tường cá nhân${job.account?.name ? ` — ${job.account.name}` : ""}`;
  if (isPageJob(job)) return `📄 Fanpage${job.result?.pageName ? ` ${job.result.pageName}` : ""}`;
  return job?.group?.name || "Không rõ nhóm";
}

// Link mở Facebook cho Job: link nhóm, trang cá nhân, hoặc bài fanpage đã đăng
export function getJobTargetUrl(job) {
  if (isPageJob(job)) return job.result?.permalink || "";
  if (isProfileJob(job)) {
    const account = loadAccounts().find((item) => String(item.id) === String(job.accountId)) || job.account;
    return account?.profileUrl || "https://www.facebook.com/me";
  }
  return job?.group?.url || "";
}

function persist(job) {
  return supabase.from("facebook_queue").update(rowFromJob(job)).eq("id", job.id).select("*").single().then(({ data, error }) => {
    if (error) throw error;
    return jobFromRow(data);
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

// ==========================================
// JOB ĐĂNG LÊN TƯỜNG CÁ NHÂN
// ==========================================
//
// Job này do Tiện ích Chrome "ToyotaSureHub Auto Wall"
// tự nhận và tự đăng (status pending → processing →
// success / failed). Ông vẫn có thể đăng tay như job nhóm.
//
// imageUrls được khóa sẵn lúc tạo để tiện ích không phải
// tự tính lại thứ tự ảnh theo variation.
// ==========================================

export function addProfileJobToQueue(options) {
  return addTargetJobToQueue("profile", options);
}

// Job Fanpage: đăng qua API chính thức (Edge Function fb-page-post).
// scheduledAt = giờ hẹn đăng trên Facebook (để trống = đăng ngay).
export function addPageJobToQueue(options) {
  return addTargetJobToQueue("page", options);
}

function addTargetJobToQueue(targetType, { campaignId = null, carId, content, imageUrls = [], accountId = null, variation = null, scheduledAt = null }) {
  const isPage = targetType === "page";
  if (!content?.trim()) throw new Error("Nội dung Facebook đang trống.");
  const urls = (Array.isArray(imageUrls) ? imageUrls : []).filter((url) => typeof url === "string" && /^https?:\/\//.test(url));
  if (!urls.length) throw new Error("Bài đăng chưa có ảnh (ảnh phải đã được lưu lên máy chủ).");
  const account = loadAccounts().find((item) => String(item.id) === String(accountId));
  if (!account) throw new Error("Chưa chọn tài khoản Facebook.");
  if (account.status !== "active") throw new Error("Tài khoản Facebook hiện không hoạt động.");

  const now = new Date().toISOString();
  const job = {
    id: crypto.randomUUID(),
    campaignId: campaignId || null,
    carId: carId || null,
    groupId: null,
    accountId: account.id,
    targetType,
    status: "pending",
    createdAt: now,
    updatedAt: now,
    scheduledAt,
    attempts: 0,
    errorReason: "",
    logs: isPage
      ? [
          { message: "📋 Bài đăng FANPAGE được thêm vào Queue", timestamp: now },
          { message: scheduledAt ? `🕒 Hẹn giờ: ${new Date(scheduledAt).toLocaleString("vi-VN")}` : "⚡ Đăng ngay", timestamp: now },
        ]
      : [
          { message: "📋 Bài đăng TƯỜNG CÁ NHÂN được thêm vào Queue", timestamp: now },
          { message: `👤 Tài khoản: ${account.name}`, timestamp: now },
          { message: "🤖 Chờ Tiện ích Chrome tự đăng", timestamp: now },
        ],
    account: { ...account },
    group: null,
    content,
    imageCount: urls.length,
    imageUrls: urls,
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
        if (String(error.message || "").includes("target_type")) {
          throw new Error("Database chưa cho phép loại job này. Ông chạy các file trong supabase/migrations (20261105_...sql) trong Supabase SQL Editor trước nhé.");
        }
        throw error;
      }
      patchStoreItem("queue", job.id, () => ({ ...job, id: data.id }));
      return { ...job, id: data.id };
    });
}

// Lấy lại 1 job từ Supabase vào store (sau khi máy chủ cập nhật)
export async function reloadQueueJob(jobId) {
  const { data, error } = await supabase.from("facebook_queue").select("*").eq("id", jobId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const fresh = jobFromRow(data);
  patchStoreItem("queue", jobId, (item) => ({ ...item, ...fresh }));
  return fresh;
}

// Đăng 1 job Fanpage ngay (hoặc gửi lịch hẹn giờ lên Facebook)
export async function publishPageJob(jobId) {
  patchStoreItem("queue", jobId, (item) => ({ ...item, status: "processing" }));
  const { data, error } = await supabase.functions.invoke("fb-page-post", { body: { jobId } });
  const fresh = await reloadQueueJob(jobId).catch(() => null);
  if (error) {
    let reason = error.message || "Không gọi được máy chủ đăng Fanpage.";
    if (/not found|404/i.test(reason)) reason = "Chưa cài Edge Function fb-page-post trên Supabase.";
    if (fresh?.status === "processing") patchStoreItem("queue", jobId, (item) => ({ ...item, status: "failed", errorReason: reason }));
    return { ok: false, reason };
  }
  return data || { ok: false, reason: "Máy chủ không trả kết quả." };
}

// Kiểm tra mã fanpage đã đủ quyền đăng bài chưa
export async function checkPageToken() {
  const { data, error } = await supabase.functions.invoke("fb-page-post", { body: { action: "check" } });
  if (error) return { ok: false, reason: error.message };
  return data;
}

// Tiện ích Chrome cập nhật trạng thái job tường trực tiếp trên
// Supabase → trang Queue gọi hàm này định kỳ để thấy kết quả mới.
export async function syncProfileJobsFromServer() {
  const local = loadPostingQueue().filter((job) => isProfileJob(job) && ["pending", "processing"].includes(job.status));
  if (!local.length) return 0;
  const { data, error } = await supabase.from("facebook_queue").select("*").in("id", local.map((job) => job.id));
  if (error) {
    console.error("Sync profile jobs error:", error);
    return 0;
  }
  let changed = 0;
  for (const row of data || []) {
    const fresh = jobFromRow(row);
    const current = local.find((job) => String(job.id) === String(row.id));
    if (current && (current.status !== fresh.status || current.updatedAt !== fresh.updatedAt)) {
      patchStoreItem("queue", row.id, (item) => ({ ...item, ...fresh }));
      changed += 1;
    }
  }
  return changed;
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

// ==========================================
// XÓA TOÀN BỘ QUEUE NHÓM
// ==========================================
// Chỉ xóa job đăng NHÓM. Job Tường cá nhân & Fanpage
// được giữ lại, có nút xóa riêng (clearTargetJobs).
// ==========================================

export function clearPostingQueue() {
  setStoreData("queue", loadPostingQueue().filter((job) => normalizeTarget(job.targetType) !== "group"));
  void supabase.from("facebook_queue").delete().eq("target_type", "group").then(({ error }) => { if (error) console.error("Queue clear error:", error); });
}

// Xóa toàn bộ job Tường cá nhân + Fanpage
export async function clearTargetJobs() {
  const jobs = loadPostingQueue().filter((job) => normalizeTarget(job.targetType) !== "group");
  if (!jobs.length) return 0;
  const { error } = await supabase.from("facebook_queue").delete().in("target_type", ["profile", "page"]);
  if (error) throw error;
  setStoreData("queue", loadPostingQueue().filter((job) => normalizeTarget(job.targetType) === "group"));
  return jobs.length;
}

// ==========================================
// XÓA TOÀN BỘ JOB "THÀNH CÔNG"
// ==========================================
//
// Chỉ dọn dẹp Queue cho gọn.
// Dữ liệu Báo cáo (posting_reports) đã được
// ghi độc lập ngay lúc xác nhận đăng — KHÔNG
// mất khi các Job này bị xóa khỏi đây.
// ==========================================

export async function clearSuccessJobs() {
  const successJobs = loadPostingQueue().filter((job) => job.status === "success");

  if (!successJobs.length) {
    return 0;
  }

  const ids = successJobs.map((job) => job.id);

  const { error } = await supabase
    .from("facebook_queue")
    .delete()
    .in("id", ids);

  if (error) {
    throw error;
  }

  setStoreData(
    "queue",
    loadPostingQueue().filter((job) => job.status !== "success")
  );

  return successJobs.length;
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