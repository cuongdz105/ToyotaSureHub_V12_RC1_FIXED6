// =======================================
// ToyotaSureHub V11
// Style Research - Pattern Prompt
// =======================================
//
// Mục tiêu:
// - Phân tích các bài Facebook có tương tác tốt
// - Tìm ra Content DNA / Pattern
// - Không sao chép nguyên văn bài mẫu
// - Kết quả có thể dùng lại để AI viết bài mới
//
// Giai đoạn này:
// - Chưa tự động lấy dữ liệu Facebook
// - Người dùng tự cung cấp các bài mẫu
// =======================================


export function buildAnalysisPrompt(samples = []) {

    const cleanedSamples = samples
        .map((text) =>
            typeof text === "string"
                ? text.trim()
                : ""
        )
        .filter(Boolean);


    if (cleanedSamples.length === 0) {

        throw new Error(
            "Cần ít nhất 1 bài mẫu để phân tích."
        );

    }


    const joined = cleanedSamples
        .map(
            (text, index) =>
                `--- BÀI MẪU ${index + 1} ---\n${text}`
        )
        .join("\n\n");


    return `
Bạn là chuyên gia nghiên cứu content marketing Facebook.

NHIỆM VỤ:

Phân tích các bài đăng dưới đây để tìm ra những
PATTERN / CONTENT DNA chung của các bài viết có
tương tác tốt.

Các bài mẫu do người dùng tự thu thập:

${joined}


QUAN TRỌNG:

1. Không sao chép nguyên văn nội dung bài mẫu.

2. Không cố ghi nhớ toàn bộ câu chữ của từng bài.

3. Hãy tìm ra những nguyên tắc có thể tái sử dụng
   cho các bài viết hoàn toàn mới.

4. Tập trung vào:
   - cách mở đầu
   - cách tạo sự tò mò
   - cách dẫn dắt
   - cách trình bày thông tin
   - cách tạo cảm giác gần gũi
   - cách tạo lý do để người đọc bình luận/inbox
   - cách kết thúc bài
   - cách sử dụng emoji
   - cách sử dụng hashtag
   - độ dài và nhịp câu
   - cách xuống dòng

5. Nếu một cụm từ xuất hiện nhiều lần trong bài mẫu,
   chỉ ghi nhận nó như một đặc điểm phong cách.
   Không yêu cầu AI sử dụng nguyên văn cụm từ đó
   trong mọi bài mới.

6. Nếu các bài mẫu có những điểm khác nhau,
   hãy tìm ra điểm chung thay vì cố ép chúng thành
   một khuôn mẫu duy nhất.

7. Không tự bịa số liệu tương tác nếu dữ liệu bài mẫu
   không cung cấp.


Hãy trả về DUY NHẤT một JSON hợp lệ.

Không markdown.

Không code fence.

Không giải thích bên ngoài JSON.


CẤU TRÚC JSON BẮT BUỘC:

{
  "hookStyle": "Mô tả kiểu mở đầu thường tạo chú ý.",

  "engagementPattern": "Mô tả cách bài viết tạo tò mò, khuyến khích đọc tiếp, bình luận, chia sẻ hoặc inbox.",

  "tone": "Giọng điệu chung của các bài.",

  "sentenceLength": "ngắn | trung bình | dài",

  "paragraphStyle": "Mô tả cách chia đoạn và xuống dòng.",

  "emojiUsage": "Mô tả tần suất và vị trí sử dụng emoji.",

  "structure": [
    "Các phần của bài theo đúng thứ tự triển khai"
  ],

  "ctaStyle": "Mô tả cách kêu gọi hành động.",

  "hashtagUsage": "Mô tả cách sử dụng hashtag.",

  "commonPhrases": [
    "Các dạng cụm từ hoặc khẩu ngữ thường xuất hiện"
  ],

  "avoidPatterns": [
    "Những kiểu viết nên tránh nếu có"
  ],

  "summary": "Tóm tắt Content DNA trong 2-4 câu để một AI khác có thể áp dụng."
}


YÊU CẦU ĐẶC BIỆT:

- engagementPattern phải mô tả nguyên tắc,
  không được sao chép câu chữ.

- commonPhrases chỉ ghi những đặc điểm ngôn ngữ
  có tính khái quát.

- structure phải mô tả cách triển khai nội dung,
  ví dụ:
  ["Hook", "Thông tin xe", "Điểm đáng chú ý",
   "Tạo tò mò", "CTA"]

- summary phải đủ rõ để AI khác có thể dùng nó
  làm Style DNA khi viết một bài hoàn toàn mới.

`.trim();

}