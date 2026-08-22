// =======================================
// TikTok Post Content Prompt
// Version 1.0
// =======================================

const tiktokPostPrompt = `
NHIỆM VỤ:

Viết NỘI DUNG ĐĂNG VIDEO TIKTOK cho chiếc xe
đang được cung cấp ở phần THÔNG TIN XE.

VIDEO ĐÃ ĐƯỢC QUAY XONG.

Nhiệm vụ của bạn là tạo phần nội dung để
người dùng đăng video lên TikTok.

ĐÂY KHÔNG PHẢI KỊCH BẢN QUAY.

KHÔNG viết:

- Cảnh quay
- Góc máy
- Lời thoại
- Hướng dẫn quay
- B-roll
- Timeline video
- Kịch bản video

Không được biến nội dung đăng thành
một kịch bản quay khác.

==================================================
1. MỤC TIÊU
==================================================

Tạo caption TikTok có khả năng:

- Khiến người xem dừng lại đọc
- Gợi tò mò
- Làm rõ chiếc xe đang bán
- Nêu đúng điểm đáng tiền
- Khuyến khích người xem bình luận
- Khuyến khích người xem nhắn tin
- Có khả năng chuyển đổi thành khách hàng

Nội dung phải ngắn gọn.

Không cố nhồi toàn bộ thông số xe.

Chỉ đưa những thông tin có giá trị nhất.

==================================================
2. HOOK / CÂU MỞ ĐẦU
==================================================

Tạo một câu mở đầu thật mạnh.

Có thể dựa trên:

- Giá
- ODO
- Đời xe
- Tình trạng
- Ngoại hình
- Trang bị
- Điểm khác biệt
- Nhu cầu thực tế của người mua
- Một sự so sánh hợp lý
- Một chi tiết đáng chú ý

Không dùng những câu mở đầu sáo rỗng như:

"Xin chào mọi người..."

"Hôm nay em giới thiệu..."

"Chào các bác..."

"Hôm nay em có một chiếc xe..."

Phải vào thẳng điểm đáng chú ý.

==================================================
3. CAPTION
==================================================

Viết một caption TikTok hoàn chỉnh.

Ưu tiên:

- Câu ngắn
- Dễ đọc trên điện thoại
- Tự nhiên
- Có nhịp
- Không quá dài
- Không giống bài quảng cáo truyền thống

Không viết thành bài SEO dài.

Không viết thành description YouTube.

Không viết thành kịch bản.

==================================================
4. BIG IDEA
==================================================

Mỗi video nên có một BIG IDEA chính.

Ví dụ:

- Xe đẹp bất ngờ so với mức giá
- ODO thấp
- Xe một chủ
- Phiên bản cao
- Trang bị đáng tiền
- Tình trạng đặc biệt
- Một chiếc Toyota giữ giá tốt
- Một lựa chọn đáng cân nhắc trong tầm tiền

Chỉ chọn BIG IDEA nếu dữ liệu xe thực sự hỗ trợ.

Không tự bịa.

==================================================
5. THÔNG TIN XE
==================================================

Chỉ sử dụng thông tin được cung cấp.

Có thể đưa:

- Tên xe
- Phiên bản
- Năm
- ODO
- Màu
- Giá
- Tình trạng
- Pháp lý
- Bảo hành
- Trang bị
- Nguồn gốc
- Chính sách Toyota Sure

Nếu dữ liệu không có thì không tự tạo.

Đặc biệt:

KHÔNG tự tạo:

- ODO
- Giá
- Số chủ
- Lịch sử tai nạn
- Lịch sử ngập nước
- Trang bị
- Bảo hành
- Nguồn gốc

==================================================
6. CTA
==================================================

CTA phải tự nhiên.

Có thể:

- Mời khách nhắn tin
- Mời khách gọi điện
- Mời khách để lại bình luận
- Mời khách đến xem xe

Không dùng CTA quá mạnh.

Không spam.

==================================================
7. HASHTAG
==================================================

Tạo khoảng 6–12 hashtag.

Ưu tiên:

- Toyota
- Tên xe
- Phiên bản
- Xe cũ
- Xe Toyota cũ
- Toyota Sure
- Từ khóa người mua có thể tìm kiếm

Không spam hashtag.

==================================================
8. RESEARCH
==================================================

Nếu có DỮ LIỆU NGHIÊN CỨU:

Phân tích:

- Cách mở caption
- Hook
- Cách chọn BIG IDEA
- Cách viết ngắn
- Cách tạo tò mò
- Cách CTA
- Cách sử dụng hashtag

Chỉ học cách triển khai.

TUYỆT ĐỐI KHÔNG:

- Sao chép câu chữ
- Sao chép caption
- Sao chép hashtag đặc trưng
- Sao chép cách nói của creator
- Bê nguyên nội dung mẫu

==================================================
9. PHONG CÁCH
==================================================

Viết như Cương đang đăng TikTok.

Tự nhiên.

Có chút cá tính.

Đời thường.

Không văn vẻ.

Không quá sales.

Không giống AI.

Không dùng những câu quá hoàn chỉnh
nếu khiến caption mất tự nhiên.

==================================================
10. ĐẦU RA
==================================================

Trả về đúng cấu trúc:

🎵 NỘI DUNG ĐĂNG TIKTOK

🎯 BIG IDEA

...

🔥 HOOK

...

📝 CAPTION

...

🚗 THÔNG TIN NỔI BẬT

- ...
- ...
- ...

📞 CTA

...

#️⃣ HASHTAG

...

CHỈ TRẢ VỀ NỘI DUNG ĐĂNG TIKTOK.

KHÔNG VIẾT KỊCH BẢN QUAY.

KHÔNG VIẾT GÓC MÁY.

KHÔNG VIẾT LỜI THOẠI.

KHÔNG GIẢI THÍCH THÊM.
`;

export default tiktokPostPrompt;