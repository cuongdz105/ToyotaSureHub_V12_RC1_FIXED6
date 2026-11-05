# ToyotaSureHub Auto Wall — Tiện ích Chrome tự đăng tường cá nhân

Tiện ích tự nhận các job **"🧱 Tường cá nhân"** trong FB Queue của ToyotaSureHub,
mở trang cá nhân Facebook, dán nội dung + ảnh, bấm **Đăng**, rồi báo kết quả về Queue.

## 1. Chuẩn bị database (làm 1 lần)

Supabase → **SQL Editor** → dán toàn bộ file
`supabase/migrations/20261105_profile_wall_posting.sql` → **Run**.

Sau đó mới deploy code webapp mới lên Vercel.

## 2. Cài tiện ích vào Chrome

1. Mở `chrome://extensions`
2. Bật **Chế độ dành cho nhà phát triển** (góc phải trên)
3. Bấm **Tải tiện ích đã giải nén** → chọn thư mục `chrome-extension`
4. Ghim biểu tượng viên gạch đỏ lên thanh công cụ

## 3. Kết nối ToyotaSureHub

Bấm biểu tượng tiện ích → **Kết nối ToyotaSureHub**:

- **Supabase URL**: đã điền sẵn
- **Publishable key**: lấy giá trị `VITE_SUPABASE_PUBLISHABLE_KEY` trong file `.env`
  của dự án (hoặc Vercel → Settings → Environment Variables)
- **Email / Mật khẩu**: đúng tài khoản đăng nhập ToyotaSureHub

Mật khẩu không được lưu, tiện ích chỉ giữ phiên đăng nhập.

## 4. Chọn tài khoản Facebook

**Cài đặt đăng bài** → chọn tài khoản Facebook mà **hồ sơ Chrome này đang đăng nhập** → Lưu.

- Nên điền **link trang cá nhân** cho tài khoản trong trang *Tài khoản Facebook*
  của ToyotaSureHub. Không có thì tiện ích dùng `facebook.com/me`.
- **Nhiều tài khoản Facebook** → mỗi tài khoản 1 hồ sơ Chrome riêng
  (Chrome → ảnh đại diện góc phải → *Thêm*), mỗi hồ sơ cài 1 tiện ích và chọn đúng tài khoản.

Mặc định: tối đa **3 bài/ngày**, mỗi bài cách nhau **60–120 phút** (ngẫu nhiên),
chỉ chạy từ **8h đến 21h**.

## 5. Dùng hằng ngày

1. Trên ToyotaSureHub, lúc tạo Campaign tick **"🧱 Đăng thêm lên tường cá nhân"**
   (có thể chỉ đăng tường, không cần chọn nhóm).
2. Bật công tắc trên tiện ích. Xong — tiện ích tự đăng theo lịch.
3. Trang FB Queue tự cập nhật trạng thái job tường mỗi 30 giây.

**Lần đầu nên bấm 🧪 Chạy thử**: tiện ích mở Facebook, điền bài + ảnh nhưng
**không bấm Đăng**, để ông xem nó điền đúng chưa.

## Khi có sự cố

| Trạng thái job | Ý nghĩa | Ông làm gì |
|---|---|---|
| 🟡 Chờ xử lý (lỗi lần 1) | Lỗi giao diện/mạng, tự thử lại sau 30 phút | Không cần làm gì |
| 🟠 Chờ ông đăng Facebook | Đã bấm Đăng nhưng không chắc bài lên chưa | Xem tường; lên rồi thì bấm xác nhận, chưa thì đăng tay |
| 🔴 Thất bại | Lỗi 2 lần liên tiếp | Mở nhật ký job xem lý do |

Nếu Facebook báo **checkpoint / tạm chặn / chưa đăng nhập**, tiện ích **tự tắt**
và hiện thông báo. Ông xử lý trên Facebook xong rồi bật lại công tắc.

Cửa sổ Facebook bị lỗi được **giữ lại** để ông xem Facebook đang hiện gì.

## Lưu ý

- Chrome phải đang mở (có thể thu nhỏ) thì tiện ích mới chạy.
- Facebook đổi giao diện thì chỉ cần sửa các mẫu chữ trong `poster.js` (khối `TEXT`).
- Đăng tự động vẫn là trái điều khoản Facebook; đừng tăng giới hạn quá 5 bài/ngày.
