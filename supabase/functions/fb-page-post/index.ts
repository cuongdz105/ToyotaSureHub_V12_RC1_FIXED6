// =====================================================
// ĐĂNG BÀI LÊN FANPAGE — Edge Function "fb-page-post"
// =====================================================
// Webapp gọi hàm này với { jobId } của 1 job loại "page" trong FB Queue.
// Hàm tải ảnh lên fanpage, tạo bài (đăng ngay hoặc hẹn giờ trên Facebook),
// rồi ghi kết quả về facebook_queue + posting_reports.
//
// Gọi { action: "check" } để kiểm tra mã fanpage đã đủ quyền chưa.
//
// Dùng chung Secrets với bot fanpage (fb-bot):
//   FB_PAGE_TOKEN   Page Access Token (cần thêm quyền pages_manage_posts,
//                   pages_read_engagement)
//   FB_APP_ID, FB_APP_SECRET   để kiểm tra quyền của mã
//   FB_GRAPH_VERSION (không bắt buộc) mặc định v24.0
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY Supabase tự cấp sẵn.
//
// Deploy: TẮT "Verify JWT with legacy secret" — hàm tự kiểm tra người gọi
// đã đăng nhập ToyotaSureHub (db.auth.getUser), chạy được với cả key mới.
// =====================================================

import { createClient } from "npm:@supabase/supabase-js@2";

const env = (k: string, d = "") => Deno.env.get(k) ?? d;
const PAGE_TOKEN = env("FB_PAGE_TOKEN");
const APP_ID = env("FB_APP_ID");
const APP_SECRET = env("FB_APP_SECRET");
const GRAPH = `https://graph.facebook.com/${env("FB_GRAPH_VERSION", "v24.0")}`;

const NEEDED_SCOPES = ["pages_manage_posts", "pages_read_engagement", "pages_show_list"];
const MAX_IMAGES = 20;
const MIN_SCHEDULE_MIN = 10;          // Facebook yêu cầu hẹn giờ cách ít nhất 10 phút
const MAX_SCHEDULE_DAYS = 29;         // và không quá ~30 ngày

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

const db = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});

// -----------------------------------------------------
// Graph API
// -----------------------------------------------------
class FbError extends Error {
  code: number;
  constructor(message: string, code = 0) {
    super(message);
    this.code = code;
  }
}

async function graph(method: "GET" | "POST", path: string, params: Record<string, string> = {}) {
  const body = new URLSearchParams({ ...params, access_token: PAGE_TOKEN });
  const url = method === "GET" ? `${GRAPH}/${path}?${body}` : `${GRAPH}/${path}`;
  const res = await fetch(url, method === "GET" ? {} : { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) {
    const err = data?.error || {};
    throw new FbError(explain(err), Number(err.code) || res.status);
  }
  return data;
}

function explain(err: any): string {
  const code = Number(err?.code);
  const msg = String(err?.message || "Lỗi không rõ từ Facebook");
  if (code === 190) return "Mã fanpage (FB_PAGE_TOKEN) đã hết hạn hoặc sai — cần tạo lại mã.";
  if (code === 200 || code === 10 || /permission/i.test(msg)) {
    return "Mã fanpage chưa có quyền đăng bài (cần pages_manage_posts + pages_read_engagement).";
  }
  if (code === 368) return "Facebook đang tạm chặn fanpage đăng bài: " + msg;
  if (code === 324 || /image|photo/i.test(msg)) return "Facebook không nhận ảnh: " + msg;
  return `Facebook báo lỗi (${code || "?"}): ${msg}`;
}

let pageCache: { id: string; name: string; link: string } | null = null;
async function getPage() {
  if (!pageCache) {
    const d = await graph("GET", "me", { fields: "id,name,link" });
    pageCache = { id: String(d.id), name: d.name || "Fanpage", link: d.link || `https://www.facebook.com/${d.id}` };
  }
  return pageCache;
}

async function checkToken() {
  if (!PAGE_TOKEN) return { ok: false, reason: "Chưa đặt secret FB_PAGE_TOKEN." };
  let page;
  try {
    page = await getPage();
  } catch (e) {
    return { ok: false, reason: (e as Error).message };
  }
  let scopes: string[] = [];
  let tokenType = "";
  let expiresAt: number | null = null;
  if (APP_ID && APP_SECRET) {
    const res = await fetch(
      `${GRAPH}/debug_token?input_token=${encodeURIComponent(PAGE_TOKEN)}&access_token=${encodeURIComponent(`${APP_ID}|${APP_SECRET}`)}`,
    );
    const d = await res.json().catch(() => ({}));
    scopes = d?.data?.scopes ?? [];
    tokenType = d?.data?.type ?? "";
    expiresAt = d?.data?.expires_at || null;
  }
  const missing = NEEDED_SCOPES.filter((s) => !scopes.includes(s));
  return {
    ok: missing.length === 0 && tokenType === "PAGE",
    page,
    tokenType,
    scopes,
    missing,
    expiresAt: expiresAt ? new Date(expiresAt * 1000).toISOString() : "không hết hạn",
    reason: tokenType && tokenType !== "PAGE"
      ? "FB_PAGE_TOKEN đang là mã người dùng, không phải mã fanpage."
      : missing.length
        ? `Mã fanpage còn thiếu quyền: ${missing.join(", ")}`
        : "",
  };
}

// -----------------------------------------------------
// Đăng 1 job
// -----------------------------------------------------
function withLog(payload: any, message: string) {
  const logs = Array.isArray(payload?.logs) ? payload.logs : [];
  return { ...(payload || {}), logs: [...logs, { message, timestamp: new Date().toISOString() }] };
}

async function publishJob(jobId: string) {
  const { data: job, error } = await db.from("facebook_queue").select("*").eq("id", jobId).maybeSingle();
  if (error) throw new Error("Không đọc được job: " + error.message);
  if (!job) throw new Error("Không tìm thấy job.");
  if (job.target_type !== "page") throw new Error("Job này không phải job Fanpage.");
  if (job.status === "success") return { ok: true, already: true, result: job.payload?.result };

  // Nhận job: chỉ nhận khi đang chờ / lỗi (tránh bấm 2 lần thành 2 bài)
  const { data: claimed } = await db
    .from("facebook_queue")
    .update({
      status: "processing",
      attempts: (Number(job.attempts) || 0) + 1,
      updated_at: new Date().toISOString(),
      payload: withLog(job.payload, "📄 Bắt đầu đăng lên Fanpage"),
    })
    .eq("id", jobId)
    .in("status", ["pending", "failed"])
    .select("*");
  if (!claimed?.length) throw new Error("Job đang được đăng ở nơi khác, ông thử lại sau ít phút.");
  const current = claimed[0];

  try {
    const page = await getPage();
    const content = String(current.payload?.content || "").trim();
    if (!content) throw new Error("Bài đăng chưa có nội dung.");
    const urls: string[] = (current.payload?.imageUrls || []).filter((u: string) => /^https?:\/\//.test(u)).slice(0, MAX_IMAGES);

    // Hẹn giờ
    let scheduleUnix: number | null = null;
    if (current.scheduled_at) {
      const t = new Date(current.scheduled_at).getTime();
      const now = Date.now();
      if (t > now + MIN_SCHEDULE_MIN * 60000) {
        if (t > now + MAX_SCHEDULE_DAYS * 86400000) throw new Error(`Chỉ hẹn giờ được tối đa ${MAX_SCHEDULE_DAYS} ngày.`);
        scheduleUnix = Math.floor(t / 1000);
      }
      // Giờ hẹn đã qua hoặc dưới 10 phút → đăng ngay
    }

    // 1. Tải ảnh lên (chưa công khai), lấy id
    const mediaIds: string[] = [];
    for (const url of urls) {
      const photo = await graph("POST", `${page.id}/photos`, {
        url,
        published: "false",
        ...(scheduleUnix ? { temporary: "true" } : {}),
      });
      mediaIds.push(String(photo.id));
    }

    // 2. Tạo bài viết
    const params: Record<string, string> = { message: content };
    mediaIds.forEach((id, i) => (params[`attached_media[${i}]`] = JSON.stringify({ media_fbid: id })));
    if (scheduleUnix) {
      params.published = "false";
      params.scheduled_publish_time = String(scheduleUnix);
      params.unpublished_content_type = "SCHEDULED";
    }
    const post = await graph("POST", `${page.id}/feed`, params);
    const postId = String(post.id);

    let permalink = `https://www.facebook.com/${postId}`;
    try {
      const p = await graph("GET", postId, { fields: "permalink_url" });
      if (p?.permalink_url) permalink = p.permalink_url;
    } catch { /* bài hẹn giờ có thể chưa có link */ }

    const scheduledFor = scheduleUnix ? new Date(scheduleUnix * 1000).toISOString() : null;
    const result = {
      postId,
      permalink,
      pageId: page.id,
      pageName: page.name,
      scheduledFor,
      imageCount: mediaIds.length,
      completedAt: new Date().toISOString(),
      postedBy: "fb-page-post",
    };

    await db.from("facebook_queue").update({
      status: "success",
      error_reason: "",
      updated_at: new Date().toISOString(),
      payload: {
        ...withLog(
          current.payload,
          scheduledFor
            ? `🕒 Đã hẹn giờ trên Fanpage "${page.name}" lúc ${new Date(scheduledFor).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}`
            : `✅ Đã đăng lên Fanpage "${page.name}" (${mediaIds.length} ảnh)`,
        ),
        result,
        error: null,
      },
    }).eq("id", jobId);

    await writeReport(current, page.name, scheduledFor);
    return { ok: true, result };
  } catch (e) {
    const reason = (e as Error).message;
    await db.from("facebook_queue").update({
      status: "failed",
      error_reason: reason,
      updated_at: new Date().toISOString(),
      payload: { ...withLog(current.payload, `❌ ${reason}`), error: { reason, at: new Date().toISOString() } },
    }).eq("id", jobId);
    return { ok: false, reason };
  }
}

async function writeReport(job: any, pageName: string, scheduledFor: string | null) {
  if (!job.car_id) return;
  const { data: car } = await db
    .from("cars")
    .select("id, brand, model, version, year, color, odo, price")
    .eq("id", job.car_id)
    .maybeSingle();
  if (!car) return;
  const row: Record<string, unknown> = {
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
    account_name: job.payload?.account?.name || "",
    group_id: null,
    group_name: `📄 Fanpage ${pageName}`,
    target_type: "page",
  };
  if (scheduledFor) row.posted_at = scheduledFor;
  const { error } = await db.from("posting_reports").insert(row);
  if (error) console.error("Lỗi ghi posting_reports:", error);
}

// -----------------------------------------------------
// HTTP
// -----------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // Chỉ người đã đăng nhập ToyotaSureHub
  const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: auth } = await db.auth.getUser(jwt);
  if (!auth?.user) return json({ ok: false, reason: "Chưa đăng nhập ToyotaSureHub." }, 401);

  let body: any = {};
  try {
    body = await req.json();
  } catch { /* để trống */ }

  try {
    if (body.action === "check") return json(await checkToken());
    if (!PAGE_TOKEN) return json({ ok: false, reason: "Chưa đặt secret FB_PAGE_TOKEN trên Supabase." });
    if (!body.jobId) return json({ ok: false, reason: "Thiếu jobId." }, 400);
    return json(await publishJob(String(body.jobId)));
  } catch (e) {
    return json({ ok: false, reason: (e as Error).message });
  }
});
