// =======================================
// Toyota AI Vision Service
// V11
// =======================================
//
// Giai đoạn 1:
// - Mock Vision
// - Không gọi API
// - Không tốn tiền
//
// Flow:
//
// Ảnh
// ↓
// Mock Vision
// ↓
// Vehicle Matcher
// ↓
// Kết quả chuẩn theo brands.js
// ↓
// CarForm
//
// Sau này chỉ cần thay phần Mock Vision
// bằng Vision API thật.
// =======================================

import {
  matchVehicleResult,
} from "../utils/vehicleMatcher";


// =======================================
// DELAY
// =======================================

function delay(ms) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  );
}


// =======================================
// MOCK VISION
// =======================================

function detectFromImages(images = []) {

  const imageCount =
    Array.isArray(images)
      ? images.length
      : 0;


  if (imageCount === 0) {

    throw new Error(
      "Chưa có ảnh để nhận diện."
    );

  }


  /*
   * MOCK DATA
   *
   * Đây vẫn chưa phải Vision AI thật.
   *
   * Mục đích hiện tại:
   *
   * Ảnh
   * ↓
   * Vision
   * ↓
   * Matcher
   * ↓
   * CarForm
   */

  return {

    brand: "Toyota",

    model: "Vios",

    version: "G",

    year: "2022",

    color: "Trắng",

    odo: "",

    confidence: 0.94,

    imageCount,

    source: "mock",

    notes:
      "Kết quả mô phỏng để kiểm tra luồng AI nhận diện xe.",

  };

}


// =======================================
// RECOGNIZE CAR
// =======================================

export async function recognizeCarFromImages(
  images = []
) {

  console.log(
    "🤖 Toyota Vision đang phân tích:",
    images.length,
    "ảnh"
  );


  // Giả lập thời gian AI xử lý

  await delay(1500);


  // =====================================
  // 1. VISION NHẬN DIỆN THÔ
  // =====================================

  const visionResult =
    detectFromImages(images);


  console.log(
    "🤖 Raw Vision Result:",
    visionResult
  );


  // =====================================
  // 2. VEHICLE MATCHER
  // =====================================
  //
  // Ví dụ Vision trả:
  //
  // Toyota
  // Vios
  // G
  //
  // Matcher sẽ đối chiếu brands.js
  //
  // Toyota
  // ↓
  // Vios
  // ↓
  // G CVT
  //
  // =====================================

  const matchedResult =
    matchVehicleResult(
      visionResult
    );


  console.log(
    "🔎 Vehicle Matcher Result:",
    matchedResult
  );


  // =====================================
  // 3. KẾT QUẢ CUỐI CÙNG
  // =====================================

  const result = {

    ...visionResult,

    brand:
      matchedResult.brand ||
      visionResult.brand,

    model:
      matchedResult.model ||
      visionResult.model,

    version:
      matchedResult.version ||
      visionResult.version,

    year:
      matchedResult.year ||
      visionResult.year,

    color:
      matchedResult.color ||
      visionResult.color,

    confidence:
      matchedResult.confidence ||
      visionResult.confidence,

    matched:
      matchedResult.matched,

    matcherSource:
      "vehicleMatcher",

  };


  console.log(
    "🤖 Final Vision Result:",
    result
  );


  return result;

}