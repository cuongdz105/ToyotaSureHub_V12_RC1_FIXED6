export function reviewContent(content) {

    const errors = [];

    if (content.includes("Toyota Sure Mỹ Đình")) {
        errors.push("Không dùng Toyota Sure Mỹ Đình");
    }

    if (content.includes("Có thể nói rằng")) {
        errors.push("Không dùng 'Có thể nói rằng'");
    }

    if (content.includes("Điểm nổi bật")) {
        errors.push("Không dùng 'Điểm nổi bật'");
    }

    return {
        passed: errors.length === 0,
        errors,
    };
}