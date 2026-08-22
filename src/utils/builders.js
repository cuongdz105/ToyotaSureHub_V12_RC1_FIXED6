// =========================
// Tạo tên xe
// =========================

export function buildCarName(car) {
  return [
    car.brand,
    car.model,
    car.version,
    car.year,
  ]
    .filter(Boolean)
    .join(" ");
}


// =========================
// Giá nhập theo triệu
// =========================

export function buildPrice(price) {
  return Number(price) * 1000000;
}


// =========================
// ODO nhập theo vạn
// =========================
// Ví dụ:
// 5.5  → 55.000 km
// 3.8  → 38.000 km
// 12   → 120.000 km

export function buildOdo(odo) {
  return Number(odo) * 10000;
}


// =========================
// ODO hiển thị dạng vạn km
// =========================
// Dùng cho nội dung Facebook / TikTok / YouTube / SEO
//
// 5.5 → "5,5 vạn km"
// 3.8 → "3,8 vạn km"
// 12  → "12 vạn km"

export function formatOdoVan(odo) {
  const value = Number(odo);

  if (!Number.isFinite(value)) {
    return "";
  }

  return `${value.toLocaleString("vi-VN", {
    maximumFractionDigits: 1,
  })} vạn km`;
}


// =========================
// ODO hiển thị dạng km
// =========================
// Dùng cho bảng Quản lý xe / chi tiết xe
//
// 5.5 → "55.000 km"
// 3.8 → "38.000 km"

export function formatOdoKm(odo) {
  const value = Number(odo);

  if (!Number.isFinite(value)) {
    return "";
  }

  return `${buildOdo(value).toLocaleString("vi-VN")} km`;
}


// =========================
// Tiêu đề Facebook
// =========================

export function buildFacebookTitle(car) {
  return "🚗 " + buildCarName(car).toUpperCase();
}