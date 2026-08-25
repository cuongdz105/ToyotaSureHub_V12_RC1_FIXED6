// ================================
// Toyota AI Service
// Version 2.4 — thêm học văn phong cá nhân
// ================================

import { buildPrompt } from "../ai/engine/promptBuilder";
import { runAI } from "../ai/engine/aiEngine";

import facebookPrompt from "../ai/prompts/facebook";
import youtubePrompt from "../ai/prompts/youtube";
import tiktokPrompt from "../ai/prompts/tiktok";
import youtubePostPrompt from "../ai/prompts/youtubePost";
import tiktokPostPrompt from "../ai/prompts/tiktokPost";
import seoPrompt from "../ai/prompts/seo";
import thumbnailPrompt from "../ai/prompts/thumbnail";
import salesChatPrompt from "../ai/prompts/salesChat";

import { saveHistory } from "./historyService";
import { addMemory } from "../ai/memory/memoryEngine";
import { getPersonalStyleRules } from "./styleLearningService";

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

function sanitizeFacebookContent(content) {
  if (typeof content !== "string") {
    return content;
  }

  let result = content;

  result = result.replace(
    /(?:^|\n)\s*(?:💰\s*)?(?:giá|giá xe|mức giá)\s*(?::|-)?\s*(?:đang\s*)?(?:để|bán|chỉ|còn)?\s*\d{1,4}(?:[.,]\d{3})*(?:\s*)(?:triệu|tr|vnđ|vnd)(?:\s*đồng)?[^\n]*/gim,
    ""
  );

  result = result.replace(
    /\b(?:giá|giá xe|mức giá)\s*(?::|-)?\s*\d{1,4}(?:[.,]\d{3})*(?:\s*)(?:triệu|tr|vnđ|vnd)(?:\s*đồng)?\b[^\n]*/gim,
    ""
  );

  result = result.replace(
    /\b\d{1,4}(?:[.,]\d{3}){2}\b/g,
    ""
  );

  result = result.replace(
    /\b\d{1,4}(?:[.,]\d{3})*(?:\s*)(?:triệu|tr|vnđ|vnd)(?:\s*đồng)?\b/gi,
    ""
  );

  result = result.replace(
    /(?:^|\n)\s*(?:💰\s*)?(?:giá|giá xe|mức giá)\s*(?::|-)?\s*(?:đang\s*)?(?:để|bán|chỉ|còn)?\s*[\.\-,:;]?\s*(?=\n|$)/gim,
    ""
  );

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
  researchContext = "",
  personalStyle = ""
) {
  const aiCar =
    buildAICar(car);

  const prompt =
    buildPrompt(
      aiCar,
      template,
      researchContext,
      personalStyle
    );

  let result =
    await runAI(
      prompt,
      aiCar
    );

  if (type === "facebook") {
    result =
      sanitizeFacebookContent(result);
  }

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
  let personalStyle = "";
  try {
    personalStyle = await getPersonalStyleRules("facebook_post");
  } catch (error) {
    console.error("Không lấy được quy tắc văn phong cá nhân:", error);
  }

  return generateContent(
    car,
    "facebook",
    facebookPrompt,
    "",
    personalStyle
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

export async function generateYoutubeScript(
  car,
  researchContext = ""
) {
  return generateContent(
    car,
    "youtube-script",
    youtubePrompt,
    researchContext
  );
}

export async function generateYoutubePost(
  car,
  researchContext = ""
) {
  return generateContent(
    car,
    "youtube-post",
    youtubePostPrompt,
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

export async function generateTikTokScript(
  car,
  researchContext = ""
) {
  return generateContent(
    car,
    "tiktok-script",
    tiktokPrompt,
    researchContext
  );
}

export async function generateTikTokPost(
  car,
  researchContext = ""
) {
  return generateContent(
    car,
    "tiktok-post",
    tiktokPostPrompt,
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