// ==========================================
// ToyotaSureHub V11
// Content Research Service
// ==========================================

import {
    getContentLibrary,
} from "./contentLibraryService";

function normalize(value = "") {
    return String(value)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function buildCarKeywords(car = {}) {
    return [
        car.brand,
        car.model,
        car.version,
        car.year,
        car.color,
    ]
        .filter(Boolean)
        .map(normalize);
}

function getText(item = {}) {
    return [
        item.title,
        item.content,
        item.source,
        item.note,
        item.style,
        ...(Array.isArray(item.tags) ? item.tags : []),
    ]
        .filter(Boolean)
        .join(" ");
}

function inferPlatform(item = {}) {
    const text = normalize(getText(item));

    if (
        text.includes("youtube") ||
        text.includes("short") ||
        text.includes("yt")
    ) {
        return "youtube";
    }

    if (
        text.includes("tiktok") ||
        text.includes("tik tok") ||
        text.includes("reels")
    ) {
        return "tiktok";
    }

    // Bài thủ công không ghi nền tảng vẫn có thể dùng làm mẫu
    // nếu nội dung phù hợp.
    return "general";
}

function recencyScore(createdAt) {
    if (!createdAt) return 0;

    const created = new Date(createdAt).getTime();

    if (!Number.isFinite(created)) return 0;

    const days =
        Math.max(
            0,
            (Date.now() - created) /
                (1000 * 60 * 60 * 24)
        );

    // Bài mới có lợi thế nhẹ, không lấn át engagement.
    return Math.max(0, 10 - days * 0.08);
}

function engagementScore(item = {}) {
    const direct =
        Number(item.engagementScore || 0);

    if (direct > 0) {
        return Math.min(70, direct);
    }

    const engagement =
        item.engagement || {};

    const likes =
        Number(
            engagement.like ??
            engagement.likes ??
            0
        );

    const comments =
        Number(
            engagement.comment ??
            engagement.comments ??
            0
        );

    const shares =
        Number(
            engagement.share ??
            engagement.shares ??
            0
        );

    return Math.min(
        70,
        Math.log10(
            1 +
            likes +
            comments * 3 +
            shares * 2
        ) * 12
    );
}

function relevanceScore(item, car) {
    const text = normalize(getText(item));
    const keywords = buildCarKeywords(car);

    let score = 0;

    keywords.forEach((keyword) => {
        if (!keyword) return;

        if (text.includes(keyword)) {
            score +=
                keyword ===
                normalize(car?.model)
                    ? 22
                    : 8;
        }
    });

    return Math.min(35, score);
}

function platformScore(item, platform) {
    const inferred =
        inferPlatform(item);

    if (inferred === platform) {
        return 20;
    }

    if (inferred === "general") {
        return 5;
    }

    return 0;
}

export async function findResearchSamples(
    car,
    platform = "youtube",
    limit = 5
) {
    const items =
        await getContentLibrary();

    const scored =
        items
            .map((item) => ({
                ...item,

                _researchScore:
                    engagementScore(item) +
                    relevanceScore(
                        item,
                        car
                    ) +
                    platformScore(
                        item,
                        platform
                    ) +
                    recencyScore(
                        item.createdAt
                    ),
            }))
            .sort(
                (a, b) =>
                    b._researchScore -
                    a._researchScore
            );

    return scored
        .slice(0, limit)
        .map((item) => {
            const {
                _researchScore,
                ...clean
            } = item;

            return {
                ...clean,
                researchScore:
                    Math.round(
                        _researchScore * 10
                    ) / 10,
            };
        });
}

export function buildResearchContext(
    samples = []
) {
    if (!samples.length) {
        return "";
    }

    return samples
        .map(
            (item, index) => `
--- MẪU THAM KHẢO ${index + 1} ---
Tiêu đề:
${item.title || "Không có"}

Nội dung:
${item.content || "Không có"}

Nhãn:
${
    Array.isArray(item.tags)
        ? item.tags.join(", ")
        : ""
}

Phong cách:
${item.style || "Không ghi"}

Nguồn:
${item.source || "Không ghi"}

Điểm nghiên cứu:
${item.researchScore ?? 0}
`
        )
        .join("\n");
}