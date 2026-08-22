// =======================================
// YouTube Post Content Prompt
// Version 1.0
// =======================================

const youtubePostPrompt = `
NHIỆM VỤ:

Viết NỘI DUNG ĐĂNG VIDEO YOUTUBE cho chiếc xe
đang được cung cấp ở phần THÔNG TIN XE.

LƯU Ý QUAN TRỌNG:

Đây KHÔNG phải kịch bản quay video.

Video đã được quay xong.

Người dùng cần nội dung để đăng video lên YouTube.

KHÔNG viết hướng dẫn quay.

KHÔNG viết góc máy.

KHÔNG viết cảnh quay.

KHÔNG viết lời thoại cho người quay.

KHÔNG viết kịch bản.

Nội dung phải giống một bài đăng YouTube
hoàn chỉnh, có thể COPY và đăng ngay.

==================================================
1. MỤC TIÊU
==================================================

Tạo nội dung giúp:

- Người xem hiểu chiếc xe là xe gì
- Nắm được đời xe
- Nắm được ODO
- Biết tình trạng xe
- Biết màu xe
- Biết nguồn gốc / pháp lý nếu có
- Biết giá bán nếu có
- Biết chính sách bảo hành
- Hiểu những điểm đáng tiền của xe
- Có lý do để xem video
- Có lý do để liên hệ

Nội dung phải tự nhiên.

Không viết quá quảng cáo.

Không dùng những câu sáo rỗng.

==================================================
2. TIÊU ĐỀ YOUTUBE
==================================================

Tạo:

🎯 TIÊU ĐỀ YOUTUBE

Ưu tiên tiêu đề:

- Có tên xe
- Có đời xe
- Có ODO nếu đáng chú ý
- Có điểm nổi bật
- Có từ khóa người mua thực sự tìm kiếm

Không nhồi nhét từ khóa.

Không viết tiêu đề quá dài.

Có thể đưa ra 3 phương án tiêu đề.

Phương án 1:
Ưu tiên SEO.

Phương án 2:
Ưu tiên CTR.

Phương án 3:
Cân bằng SEO + CTR.

==================================================
3. MÔ TẢ VIDEO
==================================================

Viết phần:

📝 MÔ TẢ VIDEO

Phần đầu phải hấp dẫn vì đây là đoạn
người xem nhìn thấy đầu tiên.

Sau đó trình bày tự nhiên:

- Tên xe
- Phiên bản
- Năm sản xuất
- ODO
- Màu sắc
- Tình trạng
- Nguồn gốc / pháp lý
- Trang bị hoặc ưu điểm nổi bật
- Giá nếu có
- Bảo hành nếu có
- Toyota Sure / kiểm định nếu dữ liệu xe có
- Thông tin liên hệ

Không tự bịa thông tin.

Chỉ sử dụng dữ liệu được cung cấp.

==================================================
4. ĐIỂM NỔI BẬT
==================================================

Tạo phần:

⭐ ĐIỂM NỔI BẬT

Chọn khoảng 4–7 điểm thực sự đáng chú ý.

Không liệt kê thông số một cách máy móc.

Ưu tiên những điểm có giá trị với người mua.

==================================================
5. THÔNG TIN XE
==================================================

Tạo phần:

🚗 THÔNG TIN XE

Trình bày rõ ràng:

Tên xe:
Phiên bản:
Năm:
ODO:
Màu:
Giá:
Pháp lý:
Bảo hành:

Chỉ đưa những thông tin thực sự có trong dữ liệu xe.

Nếu không có thông tin thì không tự bịa.

==================================================
6. CTA
==================================================

Tạo CTA tự nhiên.

Ví dụ:

- Mời khách xem xe
- Mời khách nhắn tin
- Mời khách gọi điện
- Mời khách hỏi thêm thông tin

Không dùng CTA quá ép mua.

Viết theo phong cách Toyota Sure.

==================================================
7. HASHTAG
==================================================

Tạo:

#️⃣ HASHTAG

Khoảng 8–15 hashtag.

Bao gồm kết hợp:

- Thương hiệu
- Tên xe
- Phiên bản
- Năm xe nếu phù hợp
- Xe Toyota
- Xe cũ
- Toyota Sure
- Từ khóa liên quan

Không spam hashtag.

==================================================
8. PHONG CÁCH
==================================================

Viết như nội dung của Toyota Sure Mỹ Đình.

Tự nhiên.

Rõ ràng.

Dễ đọc.

Có thông tin thực tế.

Không viết kiểu báo chí.

Không viết kiểu AI.

Không phóng đại.

Không tự tạo thông số.

Không tự tạo trang bị.

Không tự tạo lịch sử xe.

Không tự tạo giá nếu dữ liệu xe không có.

==================================================
9. RESEARCH
==================================================

Nếu có DỮ LIỆU NGHIÊN CỨU / BÀI MẪU:

Có thể học:

- Cách đặt tiêu đề
- Cách viết phần mở đầu
- Cách trình bày
- Cách dùng từ khóa
- Cách tạo CTA
- Cách tổ chức nội dung

TUYỆT ĐỐI KHÔNG:

- Sao chép câu chữ
- Sao chép nguyên bài
- Bê nguyên tiêu đề
- Sao chép thương hiệu khác

Chỉ học cách triển khai.

==================================================
10. ĐẦU RA
==================================================

Trả về đúng cấu trúc:

📺 NỘI DUNG ĐĂNG YOUTUBE

🎯 TIÊU ĐỀ YOUTUBE

Phương án 1:
...

Phương án 2:
...

Phương án 3:
...

📝 MÔ TẢ VIDEO

...

⭐ ĐIỂM NỔI BẬT

- ...
- ...
- ...
- ...

🚗 THÔNG TIN XE

Tên xe:
Phiên bản:
Năm:
ODO:
Màu:
Giá:
Pháp lý:
Bảo hành:

📞 LIÊN HỆ

...

#️⃣ HASHTAG

...

CHỈ TRẢ VỀ NỘI DUNG ĐĂNG YOUTUBE.

KHÔNG VIẾT KỊCH BẢN QUAY.

KHÔNG GIẢI THÍCH THÊM.
`;

export default youtubePostPrompt;