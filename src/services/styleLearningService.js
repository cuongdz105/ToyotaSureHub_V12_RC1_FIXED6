import { supabase } from "../lib/supabase";
import { diffWords } from "https://esm.sh/diff@5.2.0";

const RATIO_THRESHOLD = 0.15;
const REBUILD_EVERY_N_EDITS = 20;

function calcEditRatio(original, edited) {
  const changes = diffWords(original, edited);
  let changedWords = 0, totalWords = 0;
  changes.forEach((part) => {
    const wordCount = part.value.trim().split(/\s+/).filter(Boolean).length;
    totalWords += wordCount;
    if (part.added || part.removed) changedWords += wordCount;
  });
  return totalWords === 0 ? 0 : changedWords / totalWords;
}

// Gọi qua Supabase Edge Function "generate-ai" (không gọi thẳng
// api.anthropic.com từ trình duyệt, vì sẽ bị chặn CORS và lộ API key).
async function callAI(prompt) {
  const { data, error } = await supabase.functions.invoke("generate-ai", {
    body: {
      prompt,
      maxTokens: 300,
    },
  });

  if (error) {
    console.error("Lỗi gọi generate-ai:", error);
    return "";
  }

  return data?.output_text || "";
}

async function quickUpdateRules(contentType, currentRules, original, edited, editsCount) {
  const rules = await callAI(
    `Quy tắc văn phong hiện tại:\n${currentRules || "(chưa có)"}\n\n` +
    `Bài AI viết:\n${original}\n\nBài sau khi biên tập:\n${edited}\n\n` +
    `Cập nhật quy tắc (giữ điểm còn đúng, thêm điểm mới, tối đa 7 gạch đầu dòng).`
  );

  if (!rules) return;

  await supabase.from("style_profile").upsert({
    content_type: contentType,
    rules,
    edits_since_rebuild: editsCount,
    updated_at: new Date(),
  });
}

async function rebuildRulesFromScratch(contentType) {
  const { data: samples } = await supabase
    .from("ai_content_edits")
    .select("edited_content")
    .eq("content_type", contentType)
    .eq("was_significantly_edited", true)
    .not("edited_content", "is", null)
    .order("created_at", { ascending: false })
    .limit(15);

  if (!samples?.length) return;
  const samplesText = samples.map((s, i) => `Mẫu ${i + 1}:\n${s.edited_content}`).join("\n\n");

  const rules = await callAI(
    `Đây là các bài viết gần nhất (đã biên tập):\n\n${samplesText}\n\n` +
    `Tóm tắt lại TOÀN BỘ quy tắc văn phong từ đầu (tối đa 7 gạch đầu dòng).`
  );

  if (!rules) return;

  await supabase.from("style_profile").upsert({
    content_type: contentType,
    rules,
    edits_since_rebuild: 0,
    sample_count: samples.length,
    updated_at: new Date(),
  });
}

export async function learnFromEdit({ contentType = "facebook_post", original, edited, carId = null }) {
  if (!original?.trim() || !edited?.trim()) return;
  if (original.trim() === edited.trim()) return;

  const ratio = calcEditRatio(original, edited);
  const significant = ratio > RATIO_THRESHOLD;

  await supabase.from("ai_content_edits").insert({
    content_type: contentType,
    original_content: original,
    edited_content: edited,
    edit_distance_ratio: ratio,
    was_significantly_edited: significant,
    car_id: carId,
  });

  if (!significant) return;

  const { data: profile } = await supabase
    .from("style_profile")
    .select("*")
    .eq("content_type", contentType)
    .maybeSingle();

  const editsCount = (profile?.edits_since_rebuild || 0) + 1;

  if (editsCount >= REBUILD_EVERY_N_EDITS) {
    await rebuildRulesFromScratch(contentType);
  } else {
    await quickUpdateRules(contentType, profile?.rules, original, edited, editsCount);
  }
}

export async function getPersonalStyleRules(contentType = "facebook_post") {
  const { data } = await supabase
    .from("style_profile")
    .select("rules")
    .eq("content_type", contentType)
    .maybeSingle();
  return data?.rules || "";
}