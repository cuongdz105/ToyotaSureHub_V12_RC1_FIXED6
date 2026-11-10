import { DEFAULT_SETTINGS } from "./defaults.js";
import { signIn, signOut, getSession, rest } from "./supabase.js";

async function getFbUid() {
  for (const url of ["https://www.facebook.com", "https://web.facebook.com"]) {
    try {
      const cookie = await chrome.cookies.get({ url, name: "c_user" });
      if (cookie?.value) return cookie.value;
    } catch { /* bỏ qua */ }
  }
  return "";
}

const uidFromProfileUrl = (url) => {
  const m = String(url || "").match(/[?&]id=(\d+)/) || String(url || "").match(/facebook\.com\/(\d{6,})(?:[/?#]|$)/);
  return m ? m[1] : "";
};

async function showFbWho(s) {
  const el = $("fbWho");
  const uid = await getFbUid();
  el.innerHTML = "";
  if (!uid) {
    el.className = "hint err";
    el.textContent = "⚠️ Chrome này chưa đăng nhập Facebook.";
    return;
  }
  const link = document.createElement("a");
  link.href = `https://www.facebook.com/profile.php?id=${uid}`;
  link.target = "_blank";
  link.textContent = "bấm vào đây để xem trang cá nhân";
  const ok = s.boundFbUid && s.boundFbUid === uid;
  const wrong = s.boundFbUid && s.boundFbUid !== uid;
  el.className = "hint " + (ok ? "ok" : wrong ? "err" : "");
  el.append(
    ok
      ? `✅ Nick Facebook của Chrome này đã gắn với "${s.accountName}" (UID ${uid}) — `
      : wrong
        ? `⛔ Chrome đang đăng nhập nick KHÁC (UID ${uid}) với nick đã gắn cho "${s.accountName}" — `
        : `Chrome đang đăng nhập Facebook UID ${uid}, chưa gắn tài khoản — `,
    link
  );
}

const $ = (id) => document.getElementById(id);
const NUM_FIELDS = [
  "activeFrom", "activeTo",
  "dailyLimit", "gapMinMinutes", "gapMaxMinutes",
  "groupDailyLimit", "groupExtraCount", "groupGapMinMinutes", "groupGapMaxMinutes",
];
const BOOL_FIELDS = ["closeWindowOnSuccess", "wallEnabled", "groupEnabled"];

async function getSettings() {
  const { settings = {} } = await chrome.storage.local.get("settings");
  return { ...DEFAULT_SETTINGS, ...settings };
}

async function saveSettings(patch) {
  const next = { ...(await getSettings()), ...patch };
  await chrome.storage.local.set({ settings: next });
  return next;
}

function setMsg(text, kind = "") {
  const el = $("runMsg");
  el.textContent = text;
  el.className = "msg " + kind;
}

function fmtTime(ms) {
  if (!ms || ms <= Date.now()) return "ngay";
  return new Date(ms).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function updateGroupTotal() {
  const per = 1 + (Number($("groupExtraCount").value) || 0);
  const times = Number($("groupDailyLimit").value) || 0;
  $("groupTotal").textContent = `≈ ${per * times} nhóm/ngày cho tài khoản này (${times} lần × ${per} nhóm).`;
}

// ---------------- Nạp form ----------------

async function fillForm() {
  const s = await getSettings();
  $("supabaseUrl").value = s.supabaseUrl;
  $("supabaseKey").value = s.supabaseKey;
  $("enabled").checked = s.enabled;
  NUM_FIELDS.forEach((key) => ($(key).value = s[key]));
  BOOL_FIELDS.forEach((key) => ($(key).checked = Boolean(s[key])));
  $("groupFallbackKeywords").value = s.groupFallbackKeywords || "";
  updateGroupTotal();

  const session = await getSession();
  $("whoami").textContent = session ? `— ${session.email}` : "— chưa đăng nhập";
  $("loginFields").hidden = Boolean(session);
  $("login").hidden = Boolean(session);
  $("logout").hidden = !session;
  if (!session || !s.supabaseKey) $("loginBox").open = true;
  if (session && !s.accountId) $("settingsBox").open = true;

  await loadAccounts(s);
  await showFbWho(s);
}

async function loadAccounts(s) {
  const select = $("accountId");
  if (!(await getSession())) return;
  try {
    const rows = await rest("GET", "facebook_accounts?select=id,name,status,profile_url&order=name.asc");
    select.innerHTML = '<option value="">— Chọn tài khoản —</option>';
    for (const row of rows || []) {
      const option = document.createElement("option");
      option.value = row.id;
      option.textContent = `${row.name}${row.status !== "active" ? " (tạm ngưng)" : ""}${row.profile_url ? "" : " · chưa có link trang cá nhân"}`;
      option.dataset.name = row.name;
      option.dataset.profileUrl = row.profile_url || "";
      select.appendChild(option);
    }
    select.value = s.accountId || "";
  } catch (error) {
    select.innerHTML = `<option value="">Lỗi tải tài khoản: ${error.message}</option>`;
  }
}

// ---------------- Trạng thái ----------------

async function refreshStatus() {
  const s = await getSettings();
  const res = await chrome.runtime.sendMessage({ type: "tsh-status" }).catch(() => null);
  if (res?.ok) {
    for (const [kind, rowId] of [["profile", "rowProfile"], ["group", "rowGroup"]]) {
      const k = res.kinds?.[kind] || {};
      const row = $(rowId);
      row.classList.toggle("off", !k.on);
      row.querySelector(".today").textContent = `${k.postedToday ?? 0}/${k.limit ?? "–"}`;
      row.querySelector(".pending").textContent = k.pending === null || k.pending === undefined ? "–" : k.pending;
      row.querySelector(".next").textContent = res.busy
        ? "đang đăng…"
        : !s.enabled
          ? "đang tắt"
          : !k.on
            ? "không bật"
            : k.postedToday >= k.limit
              ? "mai"
              : fmtTime(k.nextAllowedAt);
    }
    $("sharedInfo").textContent = res.sharedTodayCount
      ? `Hôm nay đã chia sẻ thêm ${res.sharedTodayCount} nhóm.`
      : "";
    const paused = $("paused");
    paused.hidden = !res.pausedReason || s.enabled;
    paused.textContent = `⛔ Đã tự tạm dừng: ${res.pausedReason}. Ông kiểm tra Facebook rồi bật lại công tắc.`;
  }
  const { logs = [] } = await chrome.storage.local.get("logs");
  const list = $("logs");
  list.innerHTML = "";
  if (!logs.length) list.innerHTML = '<li class="muted">Chưa có hoạt động.</li>';
  for (const item of logs.slice(0, 30)) {
    const li = document.createElement("li");
    li.className = item.level;
    const time = document.createElement("time");
    time.textContent = new Date(item.at).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });
    li.append(time, item.message);
    list.appendChild(li);
  }
}

// ---------------- Sự kiện ----------------

$("login").addEventListener("click", async () => {
  const btn = $("login");
  btn.disabled = true;
  try {
    await saveSettings({ supabaseUrl: $("supabaseUrl").value.trim(), supabaseKey: $("supabaseKey").value.trim() });
    await signIn($("email").value.trim(), $("password").value);
    $("password").value = "";
    await fillForm();
    $("settingsBox").open = true;
    setMsg("Đã đăng nhập. Ông chọn tài khoản Facebook rồi bấm Lưu.", "ok");
  } catch (error) {
    setMsg(error.message, "err");
  } finally {
    btn.disabled = false;
  }
});

$("logout").addEventListener("click", async () => {
  await signOut();
  await saveSettings({ enabled: false });
  await fillForm();
  setMsg("Đã đăng xuất, tự động đăng đã tắt.");
});

["groupExtraCount", "groupDailyLimit"].forEach((id) => $(id).addEventListener("input", updateGroupTotal));

$("save").addEventListener("click", async () => {
  const patch = {
    supabaseUrl: $("supabaseUrl").value.trim(),
    supabaseKey: $("supabaseKey").value.trim(),
    groupFallbackKeywords: $("groupFallbackKeywords").value.trim(),
  };
  NUM_FIELDS.forEach((key) => {
    const value = Number($(key).value);
    patch[key] = Number.isFinite(value) && $(key).value !== "" ? value : DEFAULT_SETTINGS[key];
  });
  BOOL_FIELDS.forEach((key) => (patch[key] = $(key).checked));
  patch.groupExtraCount = Math.max(0, Math.min(10, patch.groupExtraCount));
  if (patch.gapMaxMinutes < patch.gapMinMinutes) patch.gapMaxMinutes = patch.gapMinMinutes;
  if (patch.groupGapMaxMinutes < patch.groupGapMinMinutes) patch.groupGapMaxMinutes = patch.groupGapMinMinutes;
  if (patch.activeTo <= patch.activeFrom) {
    setMsg("Giờ kết thúc phải sau giờ bắt đầu.", "err");
    return;
  }
  const select = $("accountId");
  patch.accountId = select.value;
  patch.accountName = select.selectedOptions[0]?.dataset.name || "";

  // Gắn nick Facebook đang đăng nhập trong Chrome này với tài khoản đã chọn
  if (patch.accountId) {
    const uid = await getFbUid();
    if (!uid) {
      setMsg("Chrome này chưa đăng nhập Facebook. Ông đăng nhập Facebook trước rồi bấm Lưu lại.", "err");
      return;
    }
    const expected = uidFromProfileUrl(select.selectedOptions[0]?.dataset.profileUrl);
    if (expected && expected !== uid) {
      setMsg(`Sai nick: Chrome này đang đăng nhập UID ${uid}, nhưng "${patch.accountName}" là UID ${expected}. Ông chọn lại tài khoản cho đúng.`, "err");
      return;
    }
    const s = await getSettings();
    if (s.boundFbUid !== uid || s.accountId !== patch.accountId) {
      const sure = confirm(
        `Chrome này đang đăng nhập Facebook UID ${uid}.\n\n` +
          `Ông xác nhận đây đúng là nick "${patch.accountName}"?\n\n` +
          `(Chưa chắc thì bấm Huỷ, rồi bấm link "xem trang cá nhân" trong phần cài đặt để kiểm tra.)`
      );
      if (!sure) {
        setMsg("Chưa lưu. Ông kiểm tra lại nick Facebook rồi bấm Lưu.", "err");
        return;
      }
    }
    patch.boundFbUid = uid;
  } else {
    patch.boundFbUid = "";
  }
  await saveSettings(patch);
  await showFbWho(await getSettings());
  setMsg("Đã lưu cài đặt.", "ok");
  refreshStatus();
});

$("enabled").addEventListener("change", async (event) => {
  const s = await getSettings();
  if (event.target.checked && (!s.accountId || !(await getSession()))) {
    event.target.checked = false;
    setMsg("Ông đăng nhập và chọn tài khoản Facebook trước đã.", "err");
    return;
  }
  await saveSettings({ enabled: event.target.checked });
  if (event.target.checked) {
    const { state = {} } = await chrome.storage.local.get("state");
    await chrome.storage.local.set({ state: { ...state, pausedReason: "" } });
  }
  setMsg(event.target.checked ? "Đã BẬT tự động đăng." : "Đã TẮT tự động đăng.", event.target.checked ? "ok" : "");
  refreshStatus();
});

async function runAction(message, button, busyText) {
  const buttons = ["runNow", "dryWall", "dryGroup"].map($);
  buttons.forEach((b) => (b.disabled = true));
  const old = button.textContent;
  button.textContent = busyText;
  setMsg("Đang chạy, ông đừng đóng cửa sổ Facebook vừa mở…");
  try {
    const res = await chrome.runtime.sendMessage(message);
    setMsg(res?.reason || "Xong.", res?.ok ? "ok" : "err");
  } catch (error) {
    setMsg(error.message, "err");
  } finally {
    buttons.forEach((b) => (b.disabled = false));
    button.textContent = old;
    refreshStatus();
  }
}

$("runNow").addEventListener("click", () => runAction({ type: "tsh-run-now" }, $("runNow"), "⏳ Đang đăng…"));
$("dryWall").addEventListener("click", () => runAction({ type: "tsh-dry-run", kind: "profile" }, $("dryWall"), "⏳ Đang thử…"));
$("dryGroup").addEventListener("click", () => runAction({ type: "tsh-dry-run", kind: "group" }, $("dryGroup"), "⏳ Đang thử…"));

chrome.storage.onChanged.addListener((changes) => {
  if (changes.logs || changes.state) refreshStatus();
});

fillForm().then(refreshStatus);
