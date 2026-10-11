import { supabase } from "../lib/supabase";

// ==========================================
// ĐỌC HẾT BẢNG, KHÔNG BỊ CẮT Ở 1000 DÒNG
// Supabase chỉ trả tối đa 1000 dòng mỗi lần đọc,
// nên phải đọc từng trang rồi gộp lại.
// ==========================================

const PAGE_SIZE = 1000;

async function fetchAllRows(buildQuery) {
  const all = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await buildQuery().range(from, from + PAGE_SIZE - 1);
    if (error) return { data: null, error };
    all.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return { data: all, error: null };
}

// ==========================================
// GHI NHẬN 1 LƯỢT ĐĂNG
// Gọi khi ông xác nhận "Đã đăng thành công"
// ==========================================

export async function logPostingReport({ job, car }) {
  if (!car?.id) return null;

  const payload = {
    job_id: job?.id || null,
    car_id: car.id,
    brand: car.brand || "",
    model: car.model || "",
    version: car.version || "",
    year: car.year || null,
    color: car.color || "",
    odo: car.odo || null,
    price_at_post: car.price || null,
    account_id: job?.accountId || null,
    account_name: job?.account?.name || "",
    group_id: job?.groupId || job?.group?.id || null,
    group_name: job?.group?.name || "",
  };

  const { error } = await supabase.from("posting_reports").insert(payload);
  if (error) {
    console.error("Lỗi ghi posting_reports:", error);
  }
}

// ==========================================
// GHI LỊCH SỬ GIÁ
// Gọi khi giá xe thay đổi
// ==========================================

export async function logPriceChange(carId, price) {
  if (!carId || price === null || price === undefined) return;

  const { error } = await supabase.from("car_price_history").insert({
    car_id: carId,
    price,
  });

  if (error) {
    console.error("Lỗi ghi car_price_history:", error);
  }
}

// ==========================================
// LẤY DỮ LIỆU BÁO CÁO THEO KHOẢNG THỜI GIAN
// ==========================================

export async function getPostingReports(fromDate, toDate) {
  const { data, error } = await fetchAllRows(() => {
    let query = supabase
      .from("posting_reports")
      .select("*")
      .order("posted_at", { ascending: true })
      .order("id", { ascending: true });

    if (fromDate) query = query.gte("posted_at", fromDate);
    if (toDate) query = query.lte("posted_at", toDate);
    return query;
  });
  if (error) {
    console.error("Lỗi lấy posting_reports:", error);
    return [];
  }
  return data || [];
}

export async function getCarPriceHistory(carId) {
  const { data, error } = await supabase
    .from("car_price_history")
    .select("*")
    .eq("car_id", carId)
    .order("changed_at", { ascending: true });

  if (error) {
    console.error("Lỗi lấy car_price_history:", error);
    return [];
  }
  return data || [];
}

// ==========================================
// LẤY "LẦN ĐĂNG GẦN NHẤT" CỦA MỖI XE
// ==========================================
//
// Dùng cho Priority Engine (Dashboard).
// Đọc từ posting_reports — nguồn VĨNH VIỄN,
// không bị mất khi ông xóa Job trong Queue.
// ==========================================

export async function getLastPostedMap() {
  const { data, error } = await fetchAllRows(() =>
    supabase
      .from("posting_reports")
      .select("car_id, posted_at")
      .order("posted_at", { ascending: false })
      .order("id", { ascending: true })
  );

  if (error) {
    console.error("Lỗi lấy last posted map:", error);
    return new Map();
  }

  const map = new Map();
  (data || []).forEach((row) => {
    const key = String(row.car_id);
    const existing = map.get(key);
    if (!existing || new Date(row.posted_at) > new Date(existing)) {
      map.set(key, row.posted_at);
    }
  });

  return map;
}

// ==========================================
// TỔNG HỢP DỮ LIỆU (tính ở phía client)
// ==========================================

export function summarizeByModel(reports) {
  const map = new Map();
  reports.forEach((r) => {
    const key = r.model || "(Không rõ)";
    map.set(key, (map.get(key) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([model, count]) => ({ model, count }))
    .sort((a, b) => b.count - a.count);
}

export function summarizeByCar(reports) {
  const map = new Map();
  reports.forEach((r) => {
    const key = r.car_id;
    if (!map.has(key)) {
      map.set(key, {
        carId: key,
        brand: r.brand,
        model: r.model,
        version: r.version,
        year: r.year,
        color: r.color,
        count: 0,
        lastPostedAt: r.posted_at,
        lastPrice: r.price_at_post,
      });
    }
    const entry = map.get(key);
    entry.count += 1;
    if (new Date(r.posted_at) > new Date(entry.lastPostedAt)) {
      entry.lastPostedAt = r.posted_at;
      entry.lastPrice = r.price_at_post;
    }
  });
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

export function summarizeByAccount(reports) {
  const map = new Map();
  reports.forEach((r) => {
    const key = r.account_name || "(Không rõ)";
    map.set(key, (map.get(key) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([account, count]) => ({ account, count }))
    .sort((a, b) => b.count - a.count);
}

export function summarizeByGroup(reports) {
  const map = new Map();
  reports.forEach((r) => {
    const key = r.group_name || "(Không rõ)";
    map.set(key, (map.get(key) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([group, count]) => ({ group, count }))
    .sort((a, b) => b.count - a.count);
}

// ==========================================
// ĐÁNH GIÁ 🟢🟡🔴
// Rule đơn giản, dạng cấu hình — dễ chỉnh sau này
// ==========================================

export const EVALUATION_THRESHOLDS = {
  yellowDays: 14,
  yellowPosts: 30,
  redDays: 30,
  redPosts: 60,
};

export function evaluateCar(
  { daysSelling, totalPosts },
  thresholds = EVALUATION_THRESHOLDS
) {
  if (daysSelling >= thresholds.redDays && totalPosts >= thresholds.redPosts) {
    return { level: "red", label: "🔴 Cần xem xét" };
  }
  if (daysSelling >= thresholds.yellowDays || totalPosts >= thresholds.yellowPosts) {
    return { level: "yellow", label: "🟡 Cần theo dõi" };
  }
  return { level: "green", label: "🟢 Bình thường" };
}
