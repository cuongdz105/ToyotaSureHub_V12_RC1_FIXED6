// ==========================================================
// TOYOTASUREHUB AUTO WALL — BỘ ĐIỀU PHỐI CHẠY NỀN
// ==========================================================
// Cứ 1 phút kiểm tra 1 lần:
//   - Đang bật? Đang trong giờ hoạt động? Đã đủ giãn cách?
//   - Hôm nay chưa vượt giới hạn bài?
//   → Lấy 1 job "tường cá nhân" đang chờ của tài khoản này,
//     nhận job (pending → processing), mở Facebook, đăng,
//     rồi ghi kết quả (success / failed) về Supabase.
// ==========================================================

import { rest, getSession } from "./supabase.js";
import { postToWall } from "./poster.js";
import { DEFAULT_SETTINGS } from "./defaults.js";

const ALARM = "tsh-tick";
const MAX_ATTEMPTS = 2;               // Thử tối đa 2 lần rồi mới báo Thất bại
const RETRY_DELAY_MIN = 30;           // Lỗi thì 30 phút sau thử lại
const STUCK_AFTER_MIN = 15;           // Job "đang xử lý" quá 15 phút = bị kẹt
const MAX_IMAGES = 20;
const JOB_TIMEOUT_MS = 6 * 60 * 1000;



// ---------------- Tiện ích nhỏ ----------------

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const randBetween = (min, max) => Math.round(min + Math.random() * Math.max(0, max - min));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getSettings() {
  const { settings = {} } = await chrome.storage.local.get("settings");
  return { ...DEFAULT_SETTINGS, ...settings };
}

async function getState() {
  const { state = {} } = await chrome.storage.local.get("state");
  return state;
}

async function patchState(patch) {
  const state = await getState();
  const next = { ...state, ...patch };
  await chrome.storage.local.set({ state: next });
  return next;
}

async function log(message, level = "info") {
  const { logs = [] } = await chrome.storage.local.get("logs");
  logs.unshift({ at: new Date().toISOString(), level, message });
  await chrome.storage.local.set({ logs: logs.slice(0, 80) });
  console[level === "error" ? "error" : "log"]("[TSH Auto Wall]", message);
}

async function postedToday() {
  const state = await getState();
  return state.countDate === todayKey() ? Number(state.countToday) || 0 : 0;
}

function notify(title, message) {
  try {
    chrome.notifications.create({ type: "basic", iconUrl: "icons/icon128.png", title, message, priority: 1 });
  } catch { /* bỏ qua */ }
}

function appendJobLog(job, message) {
  const payload = job.payload || {};
  const logs = Array.isArray(payload.logs) ? payload.logs : [];
  return { ...payload, logs: [...logs, { message, timestamp: new Date().toISOString() }] };
}

// ---------------- Lịch chạy ----------------

chrome.runtime.onInstalled.addListener(async () => {
  const { settings } = await chrome.storage.local.get("settings");
  if (!settings) await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  await chrome.alarms.create(ALARM, { periodInMinutes: 1 });
});

chrome.runtime.onStartup.addListener(async () => {
  await chrome.alarms.create(ALARM, { periodInMinutes: 1 });
  await patchState({ busySince: null });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM) tick({ manual: false }).catch((error) => log("Lỗi vòng kiểm tra: " + error.message, "error"));
});

// ---------------- Tin nhắn từ popup ----------------

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "tsh-heartbeat") return false;

  // Script đăng bài báo trang bị ẩn → đưa cửa sổ Facebook lên trước
  if (message?.type === "tsh-need-focus" && _sender?.tab?.windowId) {
    chrome.windows.update(_sender.tab.windowId, { focused: true, state: "normal" }).catch(() => {});
    log("Cửa sổ Facebook bị ẩn → tạm đưa lên trước để đăng cho xong.");
    return false;
  }

  if (message?.type === "tsh-run-now") {
    tick({ manual: true }).then(sendResponse, (error) => sendResponse({ ok: false, reason: error.message }));
    return true;
  }
  if (message?.type === "tsh-dry-run") {
    dryRun().then(sendResponse, (error) => sendResponse({ ok: false, reason: error.message }));
    return true;
  }
  if (message?.type === "tsh-status") {
    status().then(sendResponse, (error) => sendResponse({ ok: false, reason: error.message }));
    return true;
  }
  return false;
});

// ---------------- Trạng thái cho popup ----------------

async function status() {
  const settings = await getSettings();
  const state = await getState();
  let pending = null;
  if (settings.accountId && (await getSession())) {
    try {
      const rows = await rest("GET", `facebook_queue?select=id&target_type=eq.profile&status=eq.pending&account_id=eq.${encodeURIComponent(settings.accountId)}&limit=50`);
      pending = rows.length;
    } catch (error) {
      pending = "lỗi: " + error.message;
    }
  }
  return {
    ok: true,
    postedToday: await postedToday(),
    nextAllowedAt: state.nextAllowedAt || null,
    busy: Boolean(state.busySince && Date.now() - state.busySince < JOB_TIMEOUT_MS + 60000),
    pausedReason: state.pausedReason || "",
    pending,
  };
}

// ---------------- Vòng kiểm tra chính ----------------

async function tick({ manual }) {
  const settings = await getSettings();
  const state = await getState();

  if (!manual && !settings.enabled) return { ok: false, reason: "Tự động đăng đang tắt." };
  if (!settings.accountId) return { ok: false, reason: "Chưa chọn tài khoản Facebook trong tiện ích." };
  if (!(await getSession())) return { ok: false, reason: "Tiện ích chưa đăng nhập ToyotaSureHub." };

  if (state.busySince && Date.now() - state.busySince < JOB_TIMEOUT_MS + 60000) {
    return { ok: false, reason: "Đang đăng 1 bài khác." };
  }

  await recoverStuckJobs(settings);

  const hour = new Date().getHours();
  if (!manual && (hour < settings.activeFrom || hour >= settings.activeTo)) {
    return { ok: false, reason: `Ngoài giờ hoạt động (${settings.activeFrom}h–${settings.activeTo}h).` };
  }

  const count = await postedToday();
  if (count >= settings.dailyLimit) {
    return { ok: false, reason: `Hôm nay đã đăng đủ ${count}/${settings.dailyLimit} bài.` };
  }

  if (!manual && state.nextAllowedAt && Date.now() < state.nextAllowedAt) {
    return { ok: false, reason: "Chưa đến lượt (đang giãn cách)." };
  }

  const job = await pickJob(settings, { ignoreSchedule: manual });
  if (!job) return { ok: false, reason: "Không có job tường cá nhân nào đang chờ." };

  await patchState({ busySince: Date.now() });
  try {
    return await runJob(job, settings);
  } finally {
    await patchState({ busySince: null });
  }
}

async function pickJob(settings, { ignoreSchedule = false } = {}) {
  const now = new Date().toISOString();
  // Bấm "Đăng 1 bài ngay" thì lấy cả bài đang hẹn giờ thử lại
  const scheduleFilter = ignoreSchedule ? "" : `&or=(scheduled_at.is.null,scheduled_at.lte.${encodeURIComponent(now)})`;
  const rows = await rest(
    "GET",
    `facebook_queue?select=*&target_type=eq.profile&status=eq.pending` +
      `&account_id=eq.${encodeURIComponent(settings.accountId)}` +
      scheduleFilter +
      `&order=created_at.asc&limit=5`
  );
  for (const row of rows || []) {
    // Nhận job: chỉ thành công nếu job vẫn còn "pending" (tránh 2 nơi cùng đăng)
    const claimed = await rest(
      "PATCH",
      `facebook_queue?id=eq.${row.id}&status=eq.pending`,
      {
        status: "processing",
        attempts: (Number(row.attempts) || 0) + 1,
        updated_at: new Date().toISOString(),
        payload: appendJobLog(row, `🤖 Tiện ích Chrome nhận job (lần ${(Number(row.attempts) || 0) + 1})`),
      }
    );
    if (Array.isArray(claimed) && claimed.length) return claimed[0];
  }
  return null;
}

async function recoverStuckJobs(settings) {
  const cutoff = new Date(Date.now() - STUCK_AFTER_MIN * 60000).toISOString();
  const rows = await rest(
    "GET",
    `facebook_queue?select=*&target_type=eq.profile&status=eq.processing` +
      `&account_id=eq.${encodeURIComponent(settings.accountId)}&updated_at=lt.${encodeURIComponent(cutoff)}&limit=10`
  );
  for (const row of rows || []) {
    await rest("PATCH", `facebook_queue?id=eq.${row.id}&status=eq.processing`, {
      status: "manual_ready",
      updated_at: new Date().toISOString(),
      error_reason: "Tiện ích bị gián đoạn giữa chừng — ông kiểm tra tường xem bài đã lên chưa.",
      payload: appendJobLog(row, "⚠️ Bị gián đoạn khi đang đăng. Chuyển sang chờ ông kiểm tra tay để tránh đăng trùng."),
    });
    await log(`Job ${row.id} bị kẹt → chuyển sang "Chờ ông đăng" để tránh đăng trùng.`, "warn");
  }
}

// ---------------- Tải ảnh ----------------

async function fetchImages(urls) {
  const result = [];
  for (const [index, url] of urls.slice(0, MAX_IMAGES).entries()) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Không tải được ảnh ${index + 1} (${res.status})`);
    const blob = await res.blob();
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    result.push({ b64: btoa(binary), type: blob.type || "image/jpeg", name: `anh-${index + 1}.${(blob.type || "").includes("png") ? "png" : "jpg"}` });
  }
  return result;
}

// ---------------- Mở Facebook & đăng ----------------

async function getProfileUrl(settings) {
  try {
    const rows = await rest("GET", `facebook_accounts?select=profile_url&id=eq.${encodeURIComponent(settings.accountId)}&limit=1`);
    const url = rows?.[0]?.profile_url || "";
    if (/^https:\/\/(www|web|m)\.facebook\.com\//.test(url)) return url.replace("://m.", "://www.");
  } catch { /* dùng mặc định */ }
  return "https://www.facebook.com/me";
}

async function openFacebook(url) {
  const win = await chrome.windows.create({ url, focused: false, type: "normal", width: 1200, height: 900 });
  const tabId = win.tabs[0].id;
  await new Promise((resolve) => {
    const timer = setTimeout(done, 45000);
    function done() {
      clearTimeout(timer);
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    }
    function listener(id, info) {
      if (id === tabId && info.status === "complete") done();
    }
    chrome.tabs.onUpdated.addListener(listener);
  });
  await sleep(randBetween(3000, 6000));
  return { windowId: win.id, tabId };
}

async function runInTab(tabId, job, images, opts) {
  const exec = chrome.scripting.executeScript({
    target: { tabId },
    func: postToWall,
    args: [{ content: job.payload?.content || "" }, images, opts],
  });
  const timeout = new Promise((resolve) =>
    setTimeout(() => resolve([{ result: { ok: false, code: "timeout", reason: "Quá 6 phút chưa đăng xong.", steps: [] } }]), JOB_TIMEOUT_MS)
  );
  const [first] = await Promise.race([exec, timeout]);
  return first?.result || { ok: false, code: "script", reason: "Script không trả kết quả.", steps: [] };
}

async function runJob(job, settings) {
  const label = job.payload?.account?.name || settings.accountName || "tài khoản";
  await log(`Bắt đầu đăng tường (${label}) — job ${job.id}`);

  let result;
  let opened = null;
  try {
    const urls = Array.isArray(job.payload?.imageUrls) ? job.payload.imageUrls : [];
    const images = await fetchImages(urls);
    opened = await openFacebook(await getProfileUrl(settings));
    result = await runInTab(opened.tabId, job, images, { dryRun: false });
  } catch (error) {
    result = { ok: false, code: "extension", reason: error.message, steps: [] };
  }

  const stepsText = (result.steps || []).slice(-12);

  if (result.ok) {
    await rest("PATCH", `facebook_queue?id=eq.${job.id}`, {
      status: "success",
      error_reason: "",
      updated_at: new Date().toISOString(),
      payload: {
        ...appendJobLog(job, "✅ Tiện ích Chrome đã đăng lên tường cá nhân"),
        result: { completedAt: new Date().toISOString(), postedBy: "chrome-extension", steps: stepsText },
        error: null,
      },
    });
    await writeReport(job, settings);

    const count = (await postedToday()) + 1;
    const gap = randBetween(settings.gapMinMinutes, settings.gapMaxMinutes);
    await patchState({ countDate: todayKey(), countToday: count, nextAllowedAt: Date.now() + gap * 60000, pausedReason: "" });
    await log(`✅ Đăng thành công (${count}/${settings.dailyLimit} hôm nay). Bài kế tiếp sau ít nhất ${gap} phút.`);

    if (settings.closeWindowOnSuccess && opened) {
      await sleep(5000);
      chrome.windows.remove(opened.windowId).catch(() => {});
    }
    return { ok: true, reason: "Đã đăng thành công." };
  }

  // ----- Thất bại -----
  const attempts = Number(job.attempts) || 1;
  const fatal = ["blocked", "checkpoint", "login"].includes(result.code);
  // Nếu đã bấm Đăng mà không rõ kết quả → không tự thử lại (tránh đăng trùng)
  const unsure = result.code === "timeout" || (result.steps || []).some((s) => s.includes("Đã bấm \"Đăng\""));
  const retry = !fatal && !unsure && attempts < MAX_ATTEMPTS;

  const nextStatus = unsure ? "manual_ready" : retry ? "pending" : "failed";
  await rest("PATCH", `facebook_queue?id=eq.${job.id}`, {
    status: nextStatus,
    error_reason: result.reason,
    updated_at: new Date().toISOString(),
    scheduled_at: retry ? new Date(Date.now() + RETRY_DELAY_MIN * 60000).toISOString() : job.scheduled_at,
    payload: {
      ...appendJobLog(
        job,
        unsure
          ? `⚠️ ${result.reason} — đã bấm Đăng nhưng chưa chắc bài lên chưa, ông kiểm tra tường giúp.`
          : retry
            ? `❌ ${result.reason} — sẽ thử lại sau ${RETRY_DELAY_MIN} phút`
            : `❌ ${result.reason}`
      ),
      error: { code: result.code, reason: result.reason, steps: stepsText, at: new Date().toISOString() },
    },
  });

  if (fatal) {
    const settingsNow = await getSettings();
    await chrome.storage.local.set({ settings: { ...settingsNow, enabled: false } });
    await patchState({ pausedReason: result.reason });
    notify("ToyotaSureHub Auto Wall đã TẠM DỪNG", result.reason);
    await log(`⛔ Tạm dừng tự động: ${result.reason}`, "error");
  } else {
    await patchState({ nextAllowedAt: Date.now() + 10 * 60000 });
    await log(`❌ ${result.reason} → ${nextStatus === "pending" ? "sẽ thử lại" : nextStatus === "manual_ready" ? "chờ ông kiểm tra" : "báo Thất bại"}`, "error");
  }
  // Giữ cửa sổ lại khi lỗi để ông xem Facebook đang hiện gì
  return { ok: false, reason: result.reason };
}

async function writeReport(job, settings) {
  try {
    let car = null;
    if (job.car_id) {
      const rows = await rest("GET", `cars?select=id,brand,model,version,year,color,odo,price&id=eq.${job.car_id}&limit=1`);
      car = rows?.[0] || null;
    }
    if (!car) return;
    await rest("POST", "posting_reports", {
      job_id: job.id,
      car_id: car.id,
      brand: car.brand || "",
      model: car.model || "",
      version: car.version || "",
      year: car.year || null,
      color: car.color || "",
      odo: car.odo || null,
      price_at_post: car.price || null,
      account_id: job.account_id || null,
      account_name: job.payload?.account?.name || settings.accountName || "",
      group_id: null,
      group_name: "🧱 Tường cá nhân",
      target_type: "profile",
    }, { Prefer: "return=minimal" });
  } catch (error) {
    await log("Không ghi được báo cáo: " + error.message, "warn");
  }
}

// ---------------- Chạy thử (không bấm Đăng) ----------------

async function dryRun() {
  const settings = await getSettings();
  if (!settings.accountId) return { ok: false, reason: "Chưa chọn tài khoản Facebook." };

  const rows = await rest(
    "GET",
    `facebook_queue?select=*&target_type=eq.profile&status=eq.pending&account_id=eq.${encodeURIComponent(settings.accountId)}&order=created_at.asc&limit=1`
  );
  const job = rows?.[0] || {
    payload: { content: "🧪 Bài chạy thử từ ToyotaSureHub Auto Wall — tiện ích sẽ KHÔNG bấm Đăng.", imageUrls: [] },
  };
  const urls = Array.isArray(job.payload?.imageUrls) ? job.payload.imageUrls.slice(0, 3) : [];
  const images = await fetchImages(urls);
  const opened = await openFacebook(await getProfileUrl(settings));
  await chrome.windows.update(opened.windowId, { focused: true });
  const result = await runInTab(opened.tabId, job, images, { dryRun: true });
  await log(result.ok ? "🧪 Chạy thử OK — đã điền bài, chưa bấm Đăng. Ông đóng cửa sổ đó là xong." : `🧪 Chạy thử lỗi: ${result.reason}`, result.ok ? "info" : "error");
  return { ok: result.ok, reason: result.ok ? "Chạy thử OK. Ông xem cửa sổ Facebook vừa mở, rồi tự đóng (bài CHƯA đăng)." : result.reason, steps: result.steps };
}
