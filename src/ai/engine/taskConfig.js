// =======================================
// AI Task Config — chọn model theo mức độ khó của việc
// =======================================
//
// Cập nhật theo bảng giá CHÍNH THỨC của OpenAI (developers.openai.com/api/docs/pricing),
// dòng model hiện tại là GPT-5.6, chia 3 mức:
//   - gpt-5.6-luna  (rẻ nhất  : $0.20 / $1.20 mỗi 1M token)  -> việc đơn giản, output ngắn
//   - gpt-5.6-terra (tầm trung: $2.00 / $12.00 mỗi 1M token) -> kịch bản dài hơn 1 chút
//   - gpt-5.6-sol   (cao cấp nhất: $4.00 / $20.00 mỗi 1M token) -> việc cần hiểu sâu
//
// gpt-5.5 / gpt-5-mini / gpt-5.4 KHÔNG còn xuất hiện trong bảng giá
// chính thức tại thời điểm ông kiểm tra (23/8/2026) nên không dùng nữa.
//
// Ông có thể chỉnh lại bảng này bất cứ lúc nào, không cần sửa
// chỗ nào khác trong code. Nếu OpenAI đổi tên model lần nữa,
// chỉ cần sửa đúng 1 file này.

const DEFAULT_CONFIG = {
    model: "gpt-5.6-sol",
    maxTokens: 3000,
};

export const AI_TASK_CONFIG = {
    "facebook": { model: "gpt-5.6-luna", maxTokens: 600 },
    "sales-chat": { model: "gpt-5.6-luna", maxTokens: 600 },
    "seo": { model: "gpt-5.6-luna", maxTokens: 500 },

    "youtube-post": { model: "gpt-5.6-luna", maxTokens: 800 },
    "tiktok-post": { model: "gpt-5.6-luna", maxTokens: 800 },

    // Kịch bản quay dài hơn, giữ chất lượng cao hơn 1 chút
    "youtube": { model: "gpt-5.6-terra", maxTokens: 1500 },
    "youtube-script": { model: "gpt-5.6-terra", maxTokens: 1500 },
    "tiktok": { model: "gpt-5.6-terra", maxTokens: 1500 },
    "tiktok-script": { model: "gpt-5.6-terra", maxTokens: 1500 },

    "thumbnail": { model: "gpt-5.6-luna", maxTokens: 300 },

    // Phân tích văn phong từ bài mẫu — cần hiểu sâu, giữ model tốt nhất
    "style-analysis": { model: "gpt-5.6-sol", maxTokens: 1500 },

    // Nhận diện xe qua ảnh — cần model đọc được ảnh
    "car-recognition": { model: "gpt-5.6-terra", maxTokens: 500 },
};

export function getAITaskConfig(type) {
    return AI_TASK_CONFIG[type] || DEFAULT_CONFIG;
}