// ==========================================================
// KẾT NỐI SUPABASE (REST thuần, không cần thư viện)
// ==========================================================
// Tiện ích đăng nhập bằng đúng email/mật khẩu của ToyotaSureHub,
// nên có đúng quyền như webapp (RLS giữ nguyên).
// Mật khẩu KHÔNG được lưu — chỉ lưu access/refresh token.
// ==========================================================

const SESSION_KEY = "session";

async function getConfig() {
  const { settings = {} } = await chrome.storage.local.get("settings");
  const url = String(settings.supabaseUrl || "").replace(/\/+$/, "");
  const key = String(settings.supabaseKey || "").trim();
  if (!url || !key) throw new Error("Chưa nhập Supabase URL / Publishable key.");
  return { url, key };
}

async function saveSession(data) {
  const session = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (Number(data.expires_in) || 3600) * 1000,
    email: data.user?.email || "",
    userId: data.user?.id || "",
  };
  await chrome.storage.local.set({ [SESSION_KEY]: session });
  return session;
}

export async function getSession() {
  const { [SESSION_KEY]: session } = await chrome.storage.local.get(SESSION_KEY);
  return session || null;
}

export async function signOut() {
  await chrome.storage.local.remove(SESSION_KEY);
}

export async function signIn(email, password) {
  const { url, key } = await getConfig();
  const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error_description || data.msg || data.message || `Đăng nhập lỗi (${res.status})`);
  return saveSession(data);
}

async function refreshIfNeeded() {
  const session = await getSession();
  if (!session?.refreshToken) throw new Error("Tiện ích chưa đăng nhập ToyotaSureHub.");
  if (session.expiresAt - Date.now() > 120000) return session;

  const { url, key } = await getConfig();
  const res = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: session.refreshToken }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 400 || res.status === 401) await signOut();
    throw new Error("Phiên đăng nhập hết hạn, ông đăng nhập lại trong tiện ích nhé.");
  }
  return saveSession(data);
}

// Gọi PostgREST: rest("GET", "facebook_queue?select=*&id=eq.1")
export async function rest(method, path, body, extraHeaders = {}) {
  const { url, key } = await getConfig();
  const session = await refreshIfNeeded();
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...extraHeaders,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const message = (data && (data.message || data.hint)) || text || `HTTP ${res.status}`;
    throw new Error(`Supabase ${method} ${path.split("?")[0]}: ${message}`);
  }
  return data;
}
