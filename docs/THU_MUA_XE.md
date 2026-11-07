# 🔎 Thu mua xe — gom xe dân bán để chăm sóc & đàm phán

Menu mới: **Thu mua xe** (`/purchase-leads`). Mỗi tin lưu: SĐT, người bán (xe dân / salon), hãng, dòng, đời, km, giá rao, khu vực, nguồn, ảnh chụp, trạng thái chăm sóc, giá trả, giá chốt, hẹn gọi lại, nhật ký cuộc gọi.

## 1. Cài đặt (làm 1 lần)

1. **Supabase → SQL Editor**: chạy file `supabase/migrations/20261107_purchase_leads.sql`.
1b. Chạy tiếp file `supabase/migrations/20261107b_purchase_lead_images.sql` (mục Ảnh & giấy tờ).
2. **Deploy edge function** (dùng chung secret `OPENAI_API_KEY` đã có):
   ```
   supabase functions deploy parse-purchase-lead
   ```
3. Merge nhánh `thu-mua-xe` vào `main` → Vercel tự deploy.

## 2. Phím tắt iPhone "Lưu xe thu mua"

Dùng khi đang xem tin trên Safari (bonbanh, oto.com.vn, chotot…) hoặc khi đã bôi đen, copy nội dung bài.

1. Mở app **Phím tắt** → bấm **+** → đặt tên **Lưu xe thu mua**.
2. Bấm biểu tượng **ⓘ** (hoặc ⚙️) → bật **Hiển thị trong Bảng chia sẻ**. Ở mục loại đầu vào chỉ chọn **URL**, **Văn bản**, **Trang web Safari**.
3. Thêm tác vụ **Mã hoá URL** (URL Encode) → đầu vào: **Đầu vào phím tắt**.
4. Thêm tác vụ **Mở URL**, gõ:
   `https://toyotasurehub.com/purchase-leads/new?url=` rồi chèn biến **Văn bản đã mã hoá** ngay sau dấu `=`.
5. Xong. Từ giờ trong Safari bấm **Chia sẻ → Lưu xe thu mua** → app mở ra và AI tự đọc tin.

## 3. Cách dùng hằng ngày

| Gặp xe ở đâu | Làm gì |
|---|---|
| Nhóm Facebook (app FB) | Chụp màn hình bài (thấy rõ SĐT, giá) → mở **Thu mua xe → + Thêm tin → 🖼️ Ảnh chụp màn hình** → chọn ảnh → **Đọc thông tin xe** |
| Bài FB có chữ copy được | Giữ vào chữ → Sao chép → **+ Thêm tin → 📋 Dán** |
| bonbanh / oto.com.vn / chotot | Safari → **Chia sẻ → Lưu xe thu mua**. Nếu trang chặn hoặc phải bấm "hiện số", app sẽ báo → bấm hiện số, chụp màn hình rồi gửi ảnh |

Sau khi AI đọc: kiểm tra lại các ô → **Lưu & thêm tiếp**.

- App tự cảnh báo **tin trùng** (cùng SĐT hoặc cùng link) và **salon/cò** (AI nhận diện, hoặc 1 số đăng nhiều xe).
- Trong danh sách: bấm **📞** để gọi, **Zalo** để nhắn, bấm vào xe để đổi trạng thái, ghi giá trả / giá chốt / hẹn gọi lại.
- **Ảnh & giấy tờ khách gửi** (trong từng tin): chọn loại (Ngoại thất, Nội thất/ODO, Giấy tờ, Lỗi/trầy, Khác) → **➕ Thêm ảnh** → chọn nhiều ảnh/PDF một lúc. Ảnh khách gửi qua Zalo: giữ ảnh → Lưu vào máy, rồi chọn từ Thư viện. Bấm ảnh để xem to, đổi loại hoặc xoá.
- Nút **⏰ Cần gọi lại** hiện các xe đến hẹn.

## 4. Lưu ý

- Chỉ đọc đúng tin ông gửi, **không tự quét** Facebook hay các trang rao vặt (tránh khoá nick / bị chặn).
- SĐT là dữ liệu cá nhân: chỉ dùng để liên hệ hỏi mua đúng chiếc xe người ta đăng bán; ai từ chối thì chuyển **Bỏ**, không nhắn hàng loạt. Bảng và ảnh chỉ người đăng nhập app mới xem được.
- Chi phí AI: đọc chữ/link dùng `gpt-5.6-luna` (rất rẻ), đọc ảnh dùng `gpt-5.6-terra`. Ảnh được nén ~0.6MB trước khi gửi.
