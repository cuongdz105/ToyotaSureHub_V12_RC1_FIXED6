// =======================================
// Toyota AI Mock Engine
// Version 2.0
// =======================================

export async function mockAI(prompt, car) {

    console.log(prompt);

    await new Promise(resolve =>
        setTimeout(resolve, 1200)
    );

    // Facebook
    if (prompt.includes("Facebook")) {

        return `🚗 ${car.brand} ${car.model} ${car.version}

✨ Xe ${car.year} màu ${car.color} vừa cập bến Toyota Sure Mỹ Đình.

✅ ODO chỉ ${Number(car.odo).toLocaleString("vi-VN")} km.

💰 Giá bán: ${car.price} triệu.

✔ ${car.warranty}
✔ ${car.legal}

🔍 Đã kiểm định 176 hạng mục Toyota Sure.

💯 Cam kết:
• Không tai nạn
• Không ngập nước
• Không bổ máy

📞 Liên hệ ngay Toyota Sure Mỹ Đình để xem xe và lái thử!`;

    }

    // Youtube
    if (prompt.includes("Youtube")) {

        return `🎥 TIÊU ĐỀ

Corolla Cross ${car.year} giá chỉ ${car.price} triệu | Có nên mua?

====================

📝 MÔ TẢ

Chi tiết xe:
✔ ${car.brand} ${car.model}
✔ ${car.color}
✔ ${Number(car.odo).toLocaleString("vi-VN")} km

Liên hệ Toyota Sure Mỹ Đình.

====================

#toyota #corollacross #toyotasure`;

    }

    // TikTok
    if (prompt.includes("TikTok")) {

        return `🎬 KỊCH BẢN TIKTOK

3 giây đầu:
👉 Các bác đoán chiếc Corolla Cross này giá bao nhiêu?

10 giây tiếp:
Giới thiệu xe.

20 giây:
Quay ngoại thất.

20 giây:
Quay nội thất.

10 giây cuối:
Kêu gọi liên hệ Toyota Sure Mỹ Đình.`;

    }

    // SEO
    if (prompt.includes("SEO")) {

        return `📝 BÀI SEO

Toyota Corolla Cross ${car.year} đang là mẫu CUV được rất nhiều khách hàng lựa chọn...

(Bài viết khoảng 800 từ sẽ được GPT tạo sau này)`;

    }

    // Thumbnail
    if (prompt.includes("Thumbnail")) {

        return `🔥 10 Thumbnail

1. Giá sốc!
2. Mới như xe hãng!
3. Không mua tiếc cả đời!
4. Xe lướt cực đẹp!
5. Cross đẹp nhất tháng!
6. Chỉ hơn 4xx triệu!
7. Đẹp không tì vết!
8. Xe chuẩn Toyota Sure!
9. Bao test hãng!
10. Quá đáng tiền!`;

    }

    return "Toyota AI";
}