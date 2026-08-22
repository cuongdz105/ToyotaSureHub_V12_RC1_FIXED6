// ================================
// Toyota AI Service
// Version 2.3
// ================================

import { buildPrompt } from "../ai/engine/promptBuilder";
import { runAI } from "../ai/engine/aiEngine";

import facebookPrompt from "../ai/prompts/facebook";
import youtubePrompt from "../ai/prompts/youtube";
import tiktokPrompt from "../ai/prompts/tiktok";
import seoPrompt from "../ai/prompts/seo";
import thumbnailPrompt from "../ai/prompts/thumbnail";
import salesChatPrompt from "../ai/prompts/salesChat";

import { saveHistory } from "./historyService";
import { addMemory } from "../ai/memory/memoryEngine";

import {
  formatOdoVan,
} from "../utils/builders";


// =======================================
// CHUẨN HÓA DỮ LIỆU XE CHO AI
// =======================================

function buildAICar(car) {
  return {
    ...car,

    odo:
      formatOdoVan(car?.odo) ||
      "",
  };
}


// =======================================
// FACEBOOK PRICE SAFETY
// =======================================
// ToyotaSureHub:
// - KHÔNG cho Facebook xuất giá chính xác.
// - Nếu AI viết giá chính xác thì tự động loại bỏ.
// - Giá teaser như 4xx / 5xx vẫn được giữ nguyên.
//
// Ví dụ bị loại:
// 480 triệu
// 480tr
// 480 tr
// 480.000.000
// 480,000,000
// 480 triệu đồng
//
// Ví dụ được giữ:
// 4xx
// 5xx
// "Giá cực tốt"
// "Liên hệ em để biết giá"
// =======================================

function sanitizeFacebookContent(content) {
  if (typeof content !== "string") {
    return content;
  }

  let result = content;

  // ---------------------------------------
  // 1. Xóa các câu chứa giá chính xác
  // ---------------------------------------
  //
  // Ví dụ:
  // "Giá đang để 480 triệu."
  // "Giá xe: 480 triệu"
  // "Giá 480tr"
  //
  // Xóa cả câu để không còn câu cụt kiểu:
  // "Giá đang để ."
  //

  result = result.replace(
    /(?:^|\n)\s*(?:💰\s*)?(?:giá|giá xe|mức giá)\s*(?::|-)?\s*(?:đang\s*)?(?:để|bán|chỉ|còn)?\s*\d{1,4}(?:[.,]\d{3})*(?:\s*)(?:triệu|tr|vnđ|vnd)(?:\s*đồng)?[^\n]*/gim,
    ""
  );

  // ---------------------------------------
  // 2. Xóa dạng:
  // "Giá: 480 triệu"
  // "Giá 480tr"
  // ---------------------------------------

  result = result.replace(
    /\b(?:giá|giá xe|mức giá)\s*(?::|-)?\s*\d{1,4}(?:[.,]\d{3})*(?:\s*)(?:triệu|tr|vnđ|vnd)(?:\s*đồng)?\b[^\n]*/gim,
    ""
  );

  // ---------------------------------------
  // 3. Xóa số tiền dạng 480.000.000
  // ---------------------------------------

  result = result.replace(
    /\b\d{1,4}(?:[.,]\d{3}){2}\b/g,
    ""
  );

  // ---------------------------------------
  // 4. Xóa giá dạng 480 triệu / 480tr
  // ---------------------------------------

  result = result.replace(
    /\b\d{1,4}(?:[.,]\d{3})*(?:\s*)(?:triệu|tr|vnđ|vnd)(?:\s*đồng)?\b/gi,
    ""
  );

  // ---------------------------------------
  // 5. Dọn những câu "Giá đang để..."
  // nếu sau khi lọc vẫn còn sót lại.
  // ---------------------------------------

  result = result.replace(
    /(?:^|\n)\s*(?:💰\s*)?(?:giá|giá xe|mức giá)\s*(?::|-)?\s*(?:đang\s*)?(?:để|bán|chỉ|còn)?\s*[\.\-,:;]?\s*(?=\n|$)/gim,
    ""
  );

  // ---------------------------------------
  // 6. Dọn khoảng trắng / dòng trống dư
  // ---------------------------------------

  result = result
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return result;
}


// =======================================
// GENERATE CONTENT
// =======================================

async function generateContent(
  car,
  type,
  template,
  researchContext = ""
) {
  const aiCar =
    buildAICar(car);

  const prompt =
    buildPrompt(
      aiCar,
      template,
      researchContext
    );

  // ---------------------------------------
  // Gọi AI
  // ---------------------------------------

  let result =
    await runAI(
      prompt,
      aiCar
    );

  // ---------------------------------------
  // FACEBOOK:
  // Lọc giá chính xác sau khi AI trả kết quả.
  // ---------------------------------------

  if (type === "facebook") {
    result =
      sanitizeFacebookContent(result);
  }

  // ---------------------------------------
  // Lưu lịch sử AI
  // ---------------------------------------

  saveHistory({
    type,
    model: "gpt-5.5",
    carId: car.id,
    carName:
      `${car.brand} ${car.model} ${car.year}`,
    prompt,
    result,
  });

  console.log(
    "AI Result:",
    result
  );

  // ---------------------------------------
  // AI Memory
  // ---------------------------------------

  addMemory({
    type,
    car:
      `${car.brand} ${car.model}`,
    summary:
      result?.substring(
        0,
        200
      ) || "",
  });

  return result;
}


// =======================================
// Facebook
// =======================================

export async function generateFacebookPost(
  car
) {
  return generateContent(
    car,
    "facebook",
    facebookPrompt
  );
}


// =======================================
// Youtube
// =======================================

export async function generateYoutube(
  car,
  researchContext = ""
) {
  return generateContent(
    car,
    "youtube",
    youtubePrompt,
    researchContext
  );
}


// =======================================
// TikTok
// =======================================

export async function generateTikTok(
  car,
  researchContext = ""
) {
  return generateContent(
    car,
    "tiktok",
    tiktokPrompt,
    researchContext
  );
}


// =======================================
// SEO
// =======================================

export async function generateSEO(
  car
) {
  return generateContent(
    car,
    "seo",
    seoPrompt
  );
}


// =======================================
// Thumbnail
// =======================================

export async function generateThumbnail(
  car
) {
  return generateContent(
    car,
    "thumbnail",
    thumbnailPrompt
  );
}


// =======================================
// AI Sales Chat
// =======================================

export async function generateSalesChat(
  car
) {
  return generateContent(
    car,
    "sales-chat",
    salesChatPrompt
  );
}