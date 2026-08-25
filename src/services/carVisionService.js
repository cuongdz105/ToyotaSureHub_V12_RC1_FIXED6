// =======================================
// Toyota AI Vision Service
// V12 - Vision AI thật
// =======================================

import { runAI } from "../ai/engine/aiEngine";
import { getAITaskConfig } from "../ai/engine/taskConfig";
import { matchVehicleResult } from "../utils/vehicleMatcher";


const MAX_IMAGES_FOR_AI = 4;


function buildVisionPrompt() {
  return `
Bạn là chuyên gia nhận diện xe Toyota qua ảnh.

Hãy quan sát các ảnh được cung cấp và xác định
thông tin xe càng chính xác càng tốt.

Trả về DUY NHẤT một JSON hợp lệ, không markdown,
không giải thích bên ngoài JSON:

{
  "brand": "Hãng xe, ví dụ Toyota",
  "model": "Dòng xe, ví dụ Vios, Camry, Corolla Cross",
  "version": "Phiên bản nếu đoán được, ví dụ G, 1.8G",
  "year": "Năm sản xuất ước lượng, dạng số",
  "color": "Màu xe",
  "odo": "Số km trên đồng hồ nếu ảnh có hiện rõ, để trống nếu không đọc được",
  "confidence": "Số thập phân từ 0 đến 1, thể hiện độ tin cậy"
}

Nếu không chắc chắn về 1 trường nào, để trống
thay vì đoán bừa. Không tự bịa số liệu.
`.trim();
}


export async function recognizeCarFromImages(images = []) {

  if (!Array.isArray(images) || images.length === 0) {
    throw new Error("Chưa có ảnh để nhận diện.");
  }

  // ==========================================
  // Chuyển mảng object ảnh -> mảng URL (string)
  // ImageUploader lưu mỗi ảnh dạng { id, preview, name }
  // preview chính là base64 data URL của ảnh
  //
  // Chỉ lấy tối đa MAX_IMAGES_FOR_AI ảnh đầu tiên
  // (ảnh đầu luôn là ảnh bìa, theo cách sắp xếp
  // của ImageUploader) để tiết kiệm chi phí, thay vì
  // gửi hết toàn bộ ảnh nội thất/taplo/động cơ...
  // ==========================================

  const imageUrls = images
    .slice(0, MAX_IMAGES_FOR_AI)
    .map((img) => (typeof img === "string" ? img : img?.preview))
    .filter(Boolean);

  if (imageUrls.length === 0) {
    throw new Error("Không đọc được URL ảnh để gửi cho AI.");
  }

  console.log(
    "🤖 Toyota Vision đang phân tích:",
    imageUrls.length,
    "/",
    images.length,
    "ảnh (đã giới hạn để tiết kiệm chi phí)"
  );

  const prompt = buildVisionPrompt();

  const config = getAITaskConfig("car-recognition");

  const rawResult = await runAI(prompt, null, {
    ...config,
    images: imageUrls,
  });

  console.log("🤖 Raw Vision Result:", rawResult);

  let visionResult;

  try {
    visionResult = JSON.parse(rawResult);
  } catch (error) {
    console.error("Vision JSON parse error:", error, rawResult);
    throw new Error("AI trả về kết quả không đúng định dạng, thử lại giúp con.");
  }

  const matchedResult = matchVehicleResult(visionResult);

  console.log("🔎 Vehicle Matcher Result:", matchedResult);

  // ==========================================
  // Chuẩn hóa confidence
  //
  // matchedResult.confidence (từ vehicleMatcher.js)
  // dùng thang 0-100.
  //
  // visionResult.confidence (từ AI thật) dùng thang 0-1.
  //
  // CarForm.jsx hiển thị theo công thức x100 để ra %,
  // nên ở đây luôn phải trả về thang 0-1.
  // ==========================================

    // Ưu tiên độ tin cậy thật của AI (dựa trên việc AI "nhìn" ảnh
  // có rõ ràng hay không) — chỉ dùng điểm của vehicleMatcher
  // (dựa trên so khớp text) làm phương án dự phòng, vì cách tính
  // của matcher quá dễ chạm trần 100% dù ảnh không thực sự rõ.
  const rawConfidence =
    typeof visionResult.confidence === "number"
      ? visionResult.confidence * 100
      : matchedResult.confidence ?? 0;

  const normalizedConfidence =
    rawConfidence > 1 ? rawConfidence / 100 : rawConfidence;

  const result = {
    ...visionResult,
    brand: matchedResult.brand || visionResult.brand,
    model: matchedResult.model || visionResult.model,
    version: matchedResult.version || visionResult.version,
    year: matchedResult.year || visionResult.year,
    color: matchedResult.color || visionResult.color,
    confidence: normalizedConfidence,
    matched: matchedResult.matched,
    matcherSource: "vehicleMatcher",
    imageCount: imageUrls.length,
    source: "openai",
  };

  console.log("🤖 Final Vision Result:", result);

  return result;
}