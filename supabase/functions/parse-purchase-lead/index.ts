// ==========================================================
// parse-purchase-lead — Thu mua xe
// ----------------------------------------------------------
// Nhận 1 trong 3 loại đầu vào:
//   { text }   : nội dung bài đăng ông copy (Facebook, Zalo...)
//   { url }    : link tin rao (bonbanh.com, oto.com.vn, chotot...)
//   { image }  : ảnh chụp màn hình (data URL base64)
// Trả về thông tin xe + số điện thoại đã tách sẵn để ông xem lại rồi lưu.
//
// Chỉ đọc ĐÚNG 1 tin ông gửi, không tự quét cả trang web.
// Deploy: supabase functions deploy parse-purchase-lead
// Dùng chung secret OPENAI_API_KEY với generate-ai.
// ==========================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Model rẻ cho văn bản, model đọc ảnh tốt hơn cho ảnh chụp màn hình
const TEXT_MODEL = "gpt-5.6-luna";
const IMAGE_MODEL = "gpt-5.6-terra";
const MAX_SOURCE_CHARS = 12000;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ---------- Số điện thoại Việt Nam ----------
const PHONE_RE = /(?:\+?84|0)(?:[\s.\-]?\d){9}(?!\d)/g;

function normalizePhone(raw: string): string | null {
  let d = (raw || "").replace(/\D/g, "");
  if (d.startsWith("84") && d.length === 11) d = "0" + d.slice(2);
  if (d.length !== 10 || !/^0[235789]/.test(d)) return null;
  return d;
}

function findPhones(text: string): string[] {
  const out = new Set<string>();
  for (const m of (text || "").matchAll(PHONE_RE)) {
    const n = normalizePhone(m[0]);
    if (n) out.add(n);
  }
  return [...out];
}

// ---------- Đọc 1 trang tin rao ----------
function decodeEntities(s: string) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function metaContent(html: string, key: string) {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']`,
    "i",
  );
  return decodeEntities(html.match(re)?.[1] || "");
}

async function fetchListing(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
        "Accept-Language": "vi-VN,vi;q=0.9",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return { ok: false, reason: `Trang trả về lỗi ${res.status}` };

    const html = await res.text();
    const telLinks = [...html.matchAll(/href=["']tel:([^"']+)["']/gi)].map((m) => m[1]);
    const title = decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").trim();
    const ogTitle = metaContent(html, "og:title");
    const ogDesc = metaContent(html, "og:description");

    const body = decodeEntities(
      html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
        .replace(/<(br|\/p|\/div|\/li|\/tr|\/h\d)[^>]*>/gi, "\n")
        .replace(/<[^>]+>/g, " "),
    )
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s*\n+/g, "\n")
      .trim();

    const looksBlocked =
      body.length < 300 ||
      /(cloudflare|captcha|access denied|verify you are human|đăng nhập để tiếp tục)/i.test(body.slice(0, 2000));

    const text = [
      `TIÊU ĐỀ: ${ogTitle || title}`,
      ogDesc ? `MÔ TẢ: ${ogDesc}` : "",
      telLinks.length ? `SỐ ĐIỆN THOẠI TRÊN TRANG: ${telLinks.join(", ")}` : "",
      "NỘI DUNG TRANG:",
      body.slice(0, MAX_SOURCE_CHARS),
    ]
      .filter(Boolean)
      .join("\n");

    return { ok: !looksBlocked, reason: looksBlocked ? "Trang chặn đọc tự động" : "", text };
  } catch (e) {
    return { ok: false, reason: e instanceof Error && e.name === "AbortError" ? "Trang tải quá lâu" : "Không mở được trang" };
  } finally {
    clearTimeout(timer);
  }
}

// ---------- Prompt ----------
function buildPrompt(kind: "text" | "url" | "image", sourceHost: string) {
  return `
Bạn là trợ lý thu mua ô tô cũ tại Việt Nam. Từ ${
    kind === "image" ? "ẢNH CHỤP MÀN HÌNH bài đăng" : "NỘI DUNG tin đăng"
  } dưới đây, hãy tách thông tin chiếc xe đang được rao bán${sourceHost ? ` (nguồn: ${sourceHost})` : ""}.

Trả về DUY NHẤT một JSON hợp lệ, không markdown, không giải thích:
{
  "is_car_for_sale": true/false,           // bài có phải đang RAO BÁN ô tô không (bài hỏi mua, quảng cáo dịch vụ → false)
  "seller_type": "individual" | "dealer" | "unknown",
  "seller_type_reason": "lý do ngắn",
  "seller_name": "",
  "phone": "",                              // số điện thoại người bán, đúng như trong bài; để trống nếu không có
  "brand": "",                              // Toyota, Kia, Hyundai, Mazda, Ford, Honda, Mitsubishi, VinFast...
  "model": "",                              // Vios, Camry, Corolla Cross, Accent, CX-5...
  "version": "",                            // 1.5G, 2.0Q, AT, Luxury...
  "year": null,                             // số, năm sản xuất / đời xe
  "odo_km": null,                           // số km đã đi, dạng số (vd "6 vạn" = 60000)
  "color": "",
  "gearbox": "",                            // Số tự động / Số sàn
  "fuel": "",
  "location": "",                           // tỉnh / quận nơi xe ở
  "asking_price": null,                     // giá rao, quy ra VNĐ dạng số (vd "520tr" = 520000000, "1 tỷ 150" = 1150000000)
  "description": "",                        // tóm tắt tình trạng xe trong 1-2 câu (biển số tỉnh, chính chủ, đâm đụng, ngập...)
  "confidence": 0.0                         // độ tin cậy 0..1
}

Cách nhận biết người bán:
- "individual" (xe dân / chính chủ): đăng 1 xe, xưng "nhà em", "gia đình", "chính chủ", "đổi xe nên bán", không tên salon, không nhiều xe.
- "dealer" (salon / cò / đại lý): có tên salon/auto/showroom, "bao test hãng", "hỗ trợ trả góp", "nhiều xe", "thu mua xe cũ", đăng hàng loạt xe.
- Không đủ căn cứ → "unknown".

QUY TẮC: Trường nào không có trong ${kind === "image" ? "ảnh" : "nội dung"} thì để trống / null. TUYỆT ĐỐI không bịa số điện thoại, giá hay số km.
`.trim();
}

function extractJson(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function callOpenAI(apiKey: string, model: string, input: unknown) {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, input, max_output_tokens: 800 }),
  });
  const raw = await res.text();
  let data: any;
  try { data = JSON.parse(raw); } catch { data = { error: raw }; }
  if (!res.ok) throw new Error(data?.error?.message || data?.error || "OpenAI request failed.");
  return (
    data?.output_text ||
    data?.output
      ?.flatMap((i: any) => i?.content || [])
      ?.filter((i: any) => i?.type === "output_text")
      ?.map((i: any) => i?.text || "")
      ?.join("") ||
    ""
  );
}

function toInt(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^\d]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

// ==========================================================
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return json({ error: "OPENAI_API_KEY chưa được cấu hình trên Supabase Edge Function." }, 500);

  try {
    const body = await req.json();
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    const url = typeof body?.url === "string" ? body.url.trim() : "";
    const image = typeof body?.image === "string" ? body.image : "";

    if (!text && !url && !image) return json({ error: "Chưa có nội dung, link hay ảnh để đọc." }, 400);

    let kind: "text" | "url" | "image" = image ? "image" : url ? "url" : "text";
    let sourceText = text.slice(0, MAX_SOURCE_CHARS);
    let sourceHost = "";
    let fetchNote = "";

    if (url) {
      try {
        sourceHost = new URL(url).hostname.replace(/^www\./, "");
      } catch {
        return json({ error: "Link không hợp lệ." }, 400);
      }

      if (/(^|\.)facebook\.com$|(^|\.)fb\.(com|watch|me)$/.test(sourceHost)) {
        // Facebook bắt đăng nhập, không đọc được từ máy chủ
        if (!image && !text) {
          return json({
            need_screenshot: true,
            source_url: url,
            source_type: "facebook",
            message: "Facebook không cho đọc link từ máy chủ. Ông chụp màn hình bài đăng rồi gửi ảnh nhé.",
          });
        }
      } else if (!image) {
        const page = await fetchListing(url);
        if (!page.ok) {
          return json({
            need_screenshot: true,
            source_url: url,
            source_name: sourceHost,
            source_type: "website",
            message: `${page.reason}. Ông bấm "hiện số" trên trang rồi chụp màn hình gửi lên nhé.`,
          });
        }
        sourceText = page.text || "";
        fetchNote = "url";
      }
    }

    const prompt = buildPrompt(kind, sourceHost);
    const input =
      kind === "image"
        ? [
            {
              role: "user",
              content: [
                { type: "input_text", text: prompt + (text ? `\n\nGHI CHÚ KÈM THEO:\n${text}` : "") },
                { type: "input_image", image_url: image },
              ],
            },
          ]
        : `${prompt}\n\n===== NỘI DUNG =====\n${sourceText}`;

    const output = await callOpenAI(apiKey, kind === "image" ? IMAGE_MODEL : TEXT_MODEL, input);
    const ai = extractJson(output) || {};

    // Số điện thoại: với văn bản/link, chỉ tin số thực sự có trong nội dung (chống AI bịa)
    const phonesInSource = kind === "image" ? [] : findPhones(sourceText);
    const aiPhone = normalizePhone(String(ai.phone || ""));
    let phone = "";
    if (kind === "image") phone = aiPhone || "";
    else if (aiPhone && phonesInSource.includes(aiPhone)) phone = aiPhone;
    else phone = phonesInSource[0] || "";

    const sellerType = ["individual", "dealer", "unknown"].includes(ai.seller_type) ? ai.seller_type : "unknown";

    return json({
      is_car_for_sale: ai.is_car_for_sale !== false,
      source_type: url && sourceHost && !/facebook|fb\./.test(sourceHost) ? "website" : body?.source_type || "facebook",
      source_name: sourceHost || "",
      source_url: url || "",
      seller_type: sellerType,
      seller_type_reason: String(ai.seller_type_reason || ""),
      seller_name: String(ai.seller_name || ""),
      phone,
      phones_found: phonesInSource,
      brand: String(ai.brand || ""),
      model: String(ai.model || ""),
      version: String(ai.version || ""),
      year: toInt(ai.year),
      odo_km: toInt(ai.odo_km),
      color: String(ai.color || ""),
      gearbox: String(ai.gearbox || ""),
      fuel: String(ai.fuel || ""),
      location: String(ai.location || ""),
      asking_price: toInt(ai.asking_price),
      description: String(ai.description || ""),
      confidence: typeof ai.confidence === "number" ? ai.confidence : null,
      raw_text: kind === "image" ? text : sourceText.slice(0, 4000),
      read_from: fetchNote || kind,
    });
  } catch (error) {
    console.error("parse-purchase-lead error", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
