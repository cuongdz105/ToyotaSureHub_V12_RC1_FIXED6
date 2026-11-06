// ==========================================================
// TOYOTASUREHUB AUTO WALL — BỘ ĐIỀU PHỐI CHẠY NỀN
// ==========================================================
// Cứ 1 phút kiểm tra 1 lần, cho 2 loại việc:
//   🧱 TƯỜNG CÁ NHÂN: job target_type = profile
//   👥 NHÓM: job target_type = group. Mở nhóm chính của job, đăng,
//      đồng thời "Chia sẻ lên nhóm" thêm N nhóm có tên chứa dòng xe
//      (ví dụ "camry") → 1 lần đăng = 1 + N nhóm.
// Mỗi loại có giới hạn bài/ngày và giãn cách riêng, dùng chung
// giờ hoạt động và công tắc tổng. Mỗi lúc chỉ đăng 1 bài.
// ==========================================================

import { rest, getSession } from "./supabase.js";
import { postToFacebook } from "./poster.js";
import { DEFAULT_SETTINGS } from "./defaults.js";

const ALARM = "tsh-tick";
const MAX_ATTEMPTS = 2;               // Thử tối đa 2 lần rồi mới báo Thất bại
const RETRY_DELAY_MIN = 30;           // Lỗi thì 30 phút sau thử lại
const STUCK_AFTER_MIN = 15;           // Job "đang xử lý" quá 15 phút = bị kẹt
const MAX_IMAGES = 20;
const JOB_TIMEOUT_MS = 8 * 60 * 1000; // Nhóm phải cuộn danh sách nên cho lâu hơn

const KINDS = ["profile", "group"];
const KIND_LABEL = { profile: "tường", group: "nhóm" };

// ---------------- Tiện ích nhỏ ----------------

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const randBetween = (min, max) => Math.round(min + Math.random() * Math.max(0, max - min));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const norm = (text) =>
  String(text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

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

// Trạng thái riêng của từng loại (bản cũ chỉ có tường → đọc lại cho tương thích)
function kindState(state, kind) {
  if (state[kind]) return state[kind];
  if (kind === "profile") return { countDate: state.countDate, countToday: state.countToday, nextAllowedAt: state.nextAllowedAt };
  return {};
}

async function patchKind(kind, patch) {
  const state = await getState();
  return patchState({ [kind]: { ...kindState(state, kind), ...patch } });
}

function kindLimits(settings, kind) {
  return kind === "group"
    ? { on: settings.groupEnabled, daily: settings.groupDailyLimit, gapMin: settings.groupGapMinMinutes, gapMax: settings.groupGapMaxMinutes }
    : { on: settings.wallEnabled, daily: settings.dailyLimit, gapMin: settings.gapMinMinutes, gapMax: settings.gapMaxMinutes };
}

async function postedToday(kind) {
  const ks = kindState(await getState(), kind);
  return ks.countDate === todayKey() ? Number(ks.countToday) || 0 : 0;
}

// Nhóm đã "chia sẻ thêm" hôm nay, TÁCH THEO TỪNG XE:
//   { date, byCar: { <carId>: { tênChuẩnHóa: số lần } } }
// → Cùng 1 xe không đăng lại vào 1 nhóm trong ngày, nhưng xe khác
//   (Camry rồi Vios) vẫn được đăng vào nhóm chung "Vios, Altis, Camry…".
async function sharedTodayAll() {
  const state = await getState();
  return state.shared?.date === todayKey() && state.shared.byCar ? state.shared.byCar : {};
}

async function sharedToday(carId) {
  return { ...((await sharedTodayAll())[String(carId || "none")] || {}) };
}

async function addShared(carId, names) {
  const all = await sharedTodayAll();
  const key = String(carId || "none");
  const current = { ...(all[key] || {}) };
  for (const name of names) {
    const n = norm(name);
    current[n] = (current[n] || 0) + 1;
  }
  await patchState({ shared: { date: todayKey(), byCar: { ...all, [key]: current } } });
}

async function log(message, level = "info") {
  const { logs = [] } = await chrome.storage.local.get("logs");
  logs.unshift({ at: new Date().toISOString(), level, message });
  await chrome.storage.local.set({ logs: logs.slice(0, 80) });
  console[level === "error" ? "error" : "log"]("[TSH Auto Wall]", message);
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "tsh-heartbeat") return false;

  // Script đăng bài báo trang bị ẩn → đưa cửa sổ Facebook lên trước
  if (message?.type === "tsh-need-focus" && sender?.tab?.windowId) {
    chrome.windows.update(sender.tab.windowId, { focused: true, state: "normal" }).catch(() => {});
    log("Cửa sổ Facebook bị ẩn → tạm đưa lên trước để đăng cho xong.");
    return false;
  }

  if (message?.type === "tsh-run-now") {
    tick({ manual: true, only: message.kind || null }).then(sendResponse, (error) => sendResponse({ ok: false, reason: error.message }));
    return true;
  }
  if (message?.type === "tsh-dry-run") {
    dryRun(message.kind || "profile").then(sendResponse, (error) => sendResponse({ ok: false, reason: error.message }));
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
  const kinds = {};
  for (const kind of KINDS) {
    const limits = kindLimits(settings, kind);
    let pending = null;
    if (settings.accountId && (await getSession())) {
      try {
        const rows = await rest("GET", `facebook_queue?select=id&target_type=eq.${kind}&status=eq.pending&account_id=eq.${encodeURIComponent(settings.accountId)}&limit=200`);
        pending = rows.length;
      } catch (error) {
        pending = "lỗi";
      }
    }
    kinds[kind] = {
      on: limits.on,
      postedToday: await postedToday(kind),
      limit: limits.daily,
      nextAllowedAt: kindState(state, kind).nextAllowedAt || null,
      pending,
    };
  }
  const all = await sharedTodayAll();
  const sharedTotal = Object.values(all).reduce((sum, names) => sum + Object.values(names).reduce((a, b) => a + b, 0), 0);
  return {
    ok: true,
    kinds,
    sharedTodayCount: sharedTotal,
    busy: Boolean(state.busySince && Date.now() - state.busySince < JOB_TIMEOUT_MS + 60000),
    pausedReason: state.pausedReason || "",
  };
}

// ---------------- Vòng kiểm tra chính ----------------

async function tick({ manual, only = null }) {
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

  const reasons = [];
  for (const kind of only ? [only] : KINDS) {
    const limits = kindLimits(settings, kind);
    if (!manual && !limits.on) continue;

    const count = await postedToday(kind);
    if (count >= limits.daily) {
      reasons.push(`${KIND_LABEL[kind]}: đã đủ ${count}/${limits.daily} bài hôm nay`);
      continue;
    }
    const next = kindState(await getState(), kind).nextAllowedAt;
    if (!manual && next && Date.now() < next) continue;

    const job = await pickJob(settings, kind, { ignoreSchedule: manual });
    if (!job) {
      reasons.push(`không có job ${KIND_LABEL[kind]} đang chờ`);
      continue;
    }

    await patchState({ busySince: Date.now() });
    try {
      return await runJob(job, kind, settings);
    } finally {
      await patchState({ busySince: null });
    }
  }
  return { ok: false, reason: reasons.length ? reasons.join("; ") + "." : "Chưa đến lượt (đang giãn cách)." };
}

async function pickJob(settings, kind, { ignoreSchedule = false } = {}) {
  const now = new Date().toISOString();
  // Bấm "Đăng ngay" thì lấy cả bài đang hẹn giờ thử lại
  const scheduleFilter = ignoreSchedule ? "" : `&or=(scheduled_at.is.null,scheduled_at.lte.${encodeURIComponent(now)})`;
  const rows = await rest(
    "GET",
    `facebook_queue?select=*&target_type=eq.${kind}&status=eq.pending` +
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
    `facebook_queue?select=*&target_type=in.(profile,group)&status=eq.processing` +
      `&account_id=eq.${encodeURIComponent(settings.accountId)}&updated_at=lt.${encodeURIComponent(cutoff)}` +
      `&payload->>processingBy=eq.extension&limit=10`
  );
  for (const row of rows || []) {
    await rest("PATCH", `facebook_queue?id=eq.${row.id}&status=eq.processing`, {
      status: "manual_ready",
      updated_at: new Date().toISOString(),
      error_reason: "Tiện ích bị gián đoạn giữa chừng — ông kiểm tra xem bài đã lên chưa.",
      payload: appendJobLog(row, "⚠️ Bị gián đoạn khi đang đăng. Chuyển sang chờ ông kiểm tra tay để tránh đăng trùng."),
    });
    await log(`Job ${row.id} bị kẹt → chuyển sang "Chờ ông đăng" để tránh đăng trùng.`, "warn");
  }
}

// ---------------- Ảnh ----------------

// Job nhóm không lưu sẵn link ảnh → lấy ảnh xe rồi áp thứ tự của variation
async function resolveImageUrls(job) {
  const saved = Array.isArray(job.payload?.imageUrls) ? job.payload.imageUrls.filter(Boolean) : [];
  if (saved.length) return saved;
  if (!job.car_id) return [];
  const rows = await rest("GET", `car_images?select=public_url,sort_order&car_id=eq.${job.car_id}&order=sort_order.asc`);
  const all = (rows || []).map((r) => r.public_url).filter((u) => /^https?:\/\//.test(u || ""));
  const indexes = (job.payload?.variation?.imageIndexes || [])
    .map(Number)
    .filter((i) => Number.isInteger(i) && i >= 0 && i < all.length);
  return indexes.length ? indexes.map((i) => all[i]) : all;
}

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

async function getCar(carId) {
  if (!carId) return null;
  const rows = await rest("GET", `cars?select=id,brand,model,version,year,color,odo,price&id=eq.${carId}&limit=1`);
  return rows?.[0] || null;
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

// Nhận mọi kiểu link nhóm: có/không https, có/không www, m., web., fb.com,
// hoặc chỉ ghi "groups/123..." / mã số nhóm → đổi về https://www.facebook.com/...
function normalizeGroupUrl(value) {
  let raw = String(value || "").trim();
  if (!raw) return "";
  if (/^\d{5,}$/.test(raw)) raw = `groups/${raw}`;
  raw = raw
    .replace(/^https?:\/\//i, "")
    .replace(/^(www\.|web\.|m\.|mbasic\.)?(facebook\.com|fb\.com)\/?/i, "")
    .replace(/^\/+/, "");
  if (!/^groups\/[^/?#\s]+/i.test(raw)) return "";
  return `https://www.facebook.com/${raw}`;
}

function groupUrlOf(job) {
  const g = job.payload?.group || {};
  return normalizeGroupUrl(g.url) || normalizeGroupUrl(g.link) || normalizeGroupUrl(g.facebookGroupId);
}

// Job thiếu link → đọc lại từ danh sách nhóm (link / mã nhóm mới nhất)
async function resolveGroupUrl(job) {
  const fromJob = groupUrlOf(job);
  if (fromJob || !job.group_id) return fromJob;
  try {
    const rows = await rest("GET", `facebook_groups?select=group_url,group_id&id=eq.${job.group_id}&limit=1`);
    return normalizeGroupUrl(rows?.[0]?.group_url) || normalizeGroupUrl(rows?.[0]?.group_id);
  } catch {
    return "";
  }
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
    func: postToFacebook,
    args: [{ content: job.payload?.content || "" }, images, opts],
  });
  const timeout = new Promise((resolve) =>
    setTimeout(() => resolve([{ result: { ok: false, code: "timeout", reason: "Quá 8 phút chưa đăng xong.", steps: [] } }]), JOB_TIMEOUT_MS)
  );
  const [first] = await Promise.race([exec, timeout]);
  return first?.result || { ok: false, code: "script", reason: "Script không trả kết quả.", steps: [] };
}

// Chuẩn bị: link mở + tùy chọn chia sẻ thêm nhóm
async function prepare(job, kind, settings, { dryRun = false } = {}) {
  if (kind === "profile") return { url: await getProfileUrl(settings), opts: { dryRun } };

  const url = await resolveGroupUrl(job);
  if (!url) {
    const saved = String(job.payload?.group?.url || "").slice(0, 80) || "(trống)";
    throw Object.assign(new Error(`Nhóm "${job.payload?.group?.name || "?"}" chưa có link nhóm hợp lệ (đang lưu: ${saved}).`), { code: "no_url" });
  }

  const car = await getCar(job.car_id);
  const fallback = String(settings.groupFallbackKeywords || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const keywords = [car?.model, ...fallback].filter(Boolean);
  const max = Math.max(0, Math.min(10, Number(settings.groupExtraCount) || 0));

  return {
    url,
    car,
    opts: {
      dryRun,
      share: max > 0 && keywords.length
        ? { keywords, max, skip: await sharedToday(job.car_id), exclude: [job.payload?.group?.name || ""] }
        : null,
    },
  };
}

async function runJob(job, kind, settings) {
  const label = job.payload?.account?.name || settings.accountName || "tài khoản";
  const where = kind === "group" ? `nhóm "${job.payload?.group?.name || "?"}"` : "tường";
  await log(`Bắt đầu đăng ${where} (${label})`);

  // Đánh dấu job do tiện ích xử lý (để phục hồi khi bị kẹt)
  await rest("PATCH", `facebook_queue?id=eq.${job.id}`, { payload: { ...job.payload, processingBy: "extension" } }).catch(() => {});

  let result;
  let opened = null;
  let car = null;
  try {
    const prep = await prepare(job, kind, settings);
    car = prep.car || null;
    const images = await fetchImages(await resolveImageUrls(job));
    if (!images.length) throw Object.assign(new Error("Job chưa có ảnh."), { code: "no_image" });
    opened = await openFacebook(prep.url);
    result = await runInTab(opened.tabId, job, images, prep.opts);
  } catch (error) {
    result = { ok: false, code: error.code || "extension", reason: error.message, steps: [] };
  }

  const stepsText = (result.steps || []).slice(-15);
  const shared = Array.isArray(result.sharedGroups) ? result.sharedGroups : [];
  const limits = kindLimits(settings, kind);

  if (result.ok) {
    const doneMsg = kind === "group"
      ? `✅ Tiện ích Chrome đã đăng nhóm chính${shared.length ? ` + chia sẻ thêm ${shared.length} nhóm` : ""}`
      : "✅ Tiện ích Chrome đã đăng lên tường cá nhân";
    await rest("PATCH", `facebook_queue?id=eq.${job.id}`, {
      status: "success",
      error_reason: "",
      updated_at: new Date().toISOString(),
      payload: {
        ...appendJobLog(job, doneMsg + (shared.length ? `: ${shared.join(" | ")}` : "")),
        processingBy: null,
        result: { completedAt: new Date().toISOString(), postedBy: "chrome-extension", sharedGroups: shared, steps: stepsText },
        error: null,
      },
    });
    if (shared.length) await addShared(job.car_id, shared);
    await writeReport(job, kind, settings, shared, car);

    const count = (await postedToday(kind)) + 1;
    const gap = randBetween(limits.gapMin, limits.gapMax);
    await patchKind(kind, { countDate: todayKey(), countToday: count, nextAllowedAt: Date.now() + gap * 60000 });
    await patchState({ pausedReason: "" });
    await log(
      `✅ Đăng ${KIND_LABEL[kind]} thành công${kind === "group" ? ` (1 + ${shared.length} nhóm)` : ""} — ${count}/${limits.daily} hôm nay. Lượt ${KIND_LABEL[kind]} kế tiếp sau ít nhất ${gap} phút.`
    );

    if (settings.closeWindowOnSuccess && opened) {
      await sleep(5000);
      chrome.windows.remove(opened.windowId).catch(() => {});
    }
    return { ok: true, reason: `Đã đăng ${KIND_LABEL[kind]} thành công${kind === "group" ? ` (1 + ${shared.length} nhóm)` : ""}.` };
  }

  // ----- Thất bại -----
  const attempts = Number(job.attempts) || 1;
  const fatal = ["blocked", "checkpoint", "login"].includes(result.code);
  const permanent = ["not_member", "no_url", "no_image"].includes(result.code);
  // Nếu đã bấm Đăng mà không rõ kết quả → không tự thử lại (tránh đăng trùng)
  const unsure = result.code === "timeout" || (result.steps || []).some((s) => s.includes("Đã bấm \"Đăng\""));
  const retry = !fatal && !permanent && !unsure && attempts < MAX_ATTEMPTS;

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
          ? `⚠️ ${result.reason} — đã bấm Đăng nhưng chưa chắc bài lên chưa, ông kiểm tra giúp.`
          : retry
            ? `❌ ${result.reason} — sẽ thử lại sau ${RETRY_DELAY_MIN} phút`
            : `❌ ${result.reason}`
      ),
      processingBy: null,
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
    await patchKind(kind, { nextAllowedAt: Date.now() + 10 * 60000 });
    await log(`❌ ${KIND_LABEL[kind]}: ${result.reason} → ${nextStatus === "pending" ? "sẽ thử lại" : nextStatus === "manual_ready" ? "chờ ông kiểm tra" : "báo Thất bại"}`, "error");
    // Lỗi chắc chắn không đăng (chưa vào nhóm, thiếu link...) thì đóng cửa sổ luôn
    if (permanent && opened) chrome.windows.remove(opened.windowId).catch(() => {});
  }
  // Các lỗi khác giữ cửa sổ lại để ông xem Facebook đang hiện gì
  return { ok: false, reason: result.reason };
}

async function writeReport(job, kind, settings, shared, carHint) {
  try {
    const car = carHint || (await getCar(job.car_id));
    if (!car) return;
    const base = {
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
    };
    const rows =
      kind === "profile"
        ? [{ ...base, group_id: null, group_name: "🧱 Tường cá nhân", target_type: "profile" }]
        : [
            { ...base, group_id: job.group_id || null, group_name: job.payload?.group?.name || "", target_type: "group" },
            // job_id để trống: phòng khi bảng báo cáo chỉ cho 1 dòng / job
            ...shared.map((name) => ({ ...base, job_id: null, group_id: null, group_name: `${name} (chia sẻ thêm)`, target_type: "group" })),
          ];
    await rest("POST", "posting_reports", rows, { Prefer: "return=minimal" });
  } catch (error) {
    await log("Không ghi được báo cáo: " + error.message, "warn");
  }
}

// ---------------- Chạy thử (không bấm Đăng) ----------------

async function dryRun(kind) {
  const settings = await getSettings();
  if (!settings.accountId) return { ok: false, reason: "Chưa chọn tài khoản Facebook." };

  const rows = await rest(
    "GET",
    `facebook_queue?select=*&target_type=eq.${kind}&status=eq.pending&account_id=eq.${encodeURIComponent(settings.accountId)}&order=created_at.asc&limit=30`
  );
  let job = null;
  if (kind === "group") {
    for (const row of rows || []) {
      if (await resolveGroupUrl(row)) {
        job = row;
        break;
      }
    }
  } else {
    job = rows?.[0] || null;
  }
  if (!job && kind === "group" && rows?.length) {
    const sample = String(rows[0].payload?.group?.url || "(trống)").slice(0, 80);
    return { ok: false, reason: `Các job nhóm đang chờ chưa có link nhóm hợp lệ. Ví dụ link đang lưu: ${sample}` };
  }
  if (!job) {
    if (kind === "group") return { ok: false, reason: "Không có job nhóm nào đang chờ của tài khoản này để chạy thử." };
    job = { payload: { content: "🧪 Bài chạy thử từ ToyotaSureHub Auto Wall — tiện ích sẽ KHÔNG bấm Đăng.", imageUrls: [] } };
  }

  const prep = await prepare(job, kind, settings, { dryRun: true });
  const urls = (await resolveImageUrls(job)).slice(0, 3);
  const images = await fetchImages(urls);
  const opened = await openFacebook(prep.url);
  await chrome.windows.update(opened.windowId, { focused: true });
  const result = await runInTab(opened.tabId, job, images, prep.opts);
  const shared = result.sharedGroups || [];
  const extra = kind === "group" ? ` Đã tick ${shared.length} nhóm thêm (từ khoá: ${(prep.opts.share?.keywords || []).join(", ") || "không có"}).` : "";
  await log(
    result.ok
      ? `🧪 Chạy thử ${KIND_LABEL[kind]} OK — đã điền bài, chưa bấm Đăng.${extra}`
      : `🧪 Chạy thử ${KIND_LABEL[kind]} lỗi: ${result.reason}`,
    result.ok ? "info" : "error"
  );
  return {
    ok: result.ok,
    reason: result.ok ? `Chạy thử OK.${extra} Ông xem cửa sổ Facebook rồi tự đóng (bài CHƯA đăng).` : result.reason,
    steps: result.steps,
  };
}
