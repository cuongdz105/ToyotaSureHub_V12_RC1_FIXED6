// =======================================
// ToyotaSureHub V11
// Content Research - Scorer
// =======================================
//
// Nhiệm vụ:
//
// 1. Chấm mức độ giống Content DNA
// 2. Chấm hiệu quả dựa trên dữ liệu tương tác
// 3. Tách Style Match khỏi Performance
//
// QUAN TRỌNG:
//
// Style Match Score:
// → Bài viết có đi đúng Style DNA không?
//
// Performance Score:
// → Bài viết có thực sự hiệu quả không?
//
// Hai điểm này KHÔNG giống nhau.
//
// =======================================


// =======================================
// STYLE MATCH
// =======================================

export function scoreStyleMatch(
    content = "",
    style = {}
) {

    if (
        !content ||
        !style
    ) {

        return 0;

    }


    const text =
        String(content)
            .toLowerCase()
            .trim();


    if (!text) {

        return 0;

    }


    let score = 0;

    let maxScore = 0;


    // =======================================
    // 1. COMMON PHRASES
    // =======================================

    const phrases =
        Array.isArray(
            style.commonPhrases
        )
            ? style.commonPhrases
            : [];


    if (phrases.length > 0) {

        maxScore += 30;


        const matched =
            phrases.filter(
                (phrase) => {

                    if (
                        !phrase ||
                        typeof phrase !==
                            "string"
                    ) {

                        return false;

                    }


                    return text.includes(
                        phrase
                            .toLowerCase()
                    );

                }
            );


        const ratio =
            matched.length /
            phrases.length;


        score +=
            Math.min(
                30,
                ratio * 30
            );

    }


    // =======================================
    // 2. SENTENCE LENGTH
    // =======================================

    maxScore += 20;


    const sentences =
        content
            .split(
                /[.!?]+/
            )
            .map(
                (item) =>
                    item.trim()
            )
            .filter(Boolean);


    if (
        sentences.length > 0
    ) {

        const averageLength =
            sentences.reduce(
                (
                    total,
                    sentence
                ) =>
                    total +
                    sentence.length,
                0
            ) /
            sentences.length;


        const target =
            String(
                style.sentenceLength ||
                ""
            ).toLowerCase();


        let sentenceScore = 0;


        if (
            target.includes("ngắn")
        ) {

            sentenceScore =
                averageLength <= 70
                    ? 20
                    : averageLength <= 100
                        ? 12
                        : 5;

        } else if (
            target.includes("dài")
        ) {

            sentenceScore =
                averageLength >= 120
                    ? 20
                    : averageLength >= 90
                        ? 12
                        : 5;

        } else {

            sentenceScore =
                averageLength >= 60 &&
                averageLength <= 120
                    ? 20
                    : 10;

        }


        score += sentenceScore;

    }


    // =======================================
    // 3. EMOJI
    // =======================================

    maxScore += 20;


    const emojiMatches =
        content.match(
            /[\u{1F300}-\u{1FAFF}]/gu
        ) || [];


    const emojiCount =
        emojiMatches.length;


    const emojiStyle =
        String(
            style.emojiUsage ||
            ""
        ).toLowerCase();


    let emojiScore = 10;


    if (
        emojiStyle.includes("nhiều")
    ) {

        emojiScore =
            emojiCount >= 5
                ? 20
                : emojiCount >= 2
                    ? 12
                    : 5;

    } else if (
        emojiStyle.includes("ít")
    ) {

        emojiScore =
            emojiCount <= 3
                ? 20
                : 10;

    } else {

        emojiScore =
            emojiCount >= 1 &&
            emojiCount <= 6
                ? 20
                : 10;

    }


    score += emojiScore;


    // =======================================
    // 4. CTA
    // =======================================

    maxScore += 30;


    const ctaStyle =
        String(
            style.ctaStyle ||
            ""
        ).toLowerCase();


    const ctaKeywords = [
        "liên hệ",
        "ib",
        "inbox",
        "comment",
        "bình luận",
        "nhắn",
        "gọi",
        "quan tâm",
        "xem xe",
        "lái thử",
    ];


    const hasCTA =
        ctaKeywords.some(
            (keyword) =>
                text.includes(
                    keyword
                )
        );


    if (hasCTA) {

        score += 30;

    } else if (
        ctaStyle
    ) {

        score += 10;

    }


    // =======================================
    // FINAL
    // =======================================

    if (
        maxScore === 0
    ) {

        return 0;

    }


    return Math.round(
        (
            score /
            maxScore
        ) * 100
    );

}


// =======================================
// PERFORMANCE SCORE
// =======================================
//
// Giai đoạn đầu:
//
// metrics có thể truyền vào:
//
// {
//   views,
//   likes,
//   comments,
//   shares,
//   saves,
//   inbox,
//   leads
// }
//
// Không có metrics:
// → trả 0
//
// =======================================

export function scorePerformance(
    metrics = {}
) {

    const views =
        Number(
            metrics.views
        ) || 0;


    const likes =
        Number(
            metrics.likes
        ) || 0;


    const comments =
        Number(
            metrics.comments
        ) || 0;


    const shares =
        Number(
            metrics.shares
        ) || 0;


    const saves =
        Number(
            metrics.saves
        ) || 0;


    const inbox =
        Number(
            metrics.inbox
        ) || 0;


    const leads =
        Number(
            metrics.leads
        ) || 0;


    // Không có bất kỳ dữ liệu nào
    // thì chưa thể đánh giá performance.

    if (
        views === 0 &&
        likes === 0 &&
        comments === 0 &&
        shares === 0 &&
        saves === 0 &&
        inbox === 0 &&
        leads === 0
    ) {

        return 0;

    }


    // =======================================
    // ENGAGEMENT
    // =======================================

    const engagement =
        likes +
        comments * 2 +
        shares * 3 +
        saves * 2;


    // =======================================
    // ENGAGEMENT RATE
    // =======================================

    let engagementRate = 0;


    if (views > 0) {

        engagementRate =
            engagement /
            views;

    }


    // =======================================
    // LEAD VALUE
    // =======================================

    const leadScore =
        inbox * 5 +
        leads * 10;


    // =======================================
    // CHUYỂN THÀNH ĐIỂM
    // =======================================

    let score =
        engagementRate *
        1000;


    score +=
        Math.min(
            30,
            leadScore
        );


    return Math.round(
        Math.min(
            100,
            score
        )
    );

}


// =======================================
// COMBINED SCORE
// =======================================
//
// Style Match:
// 40%
//
// Performance:
// 60%
//
// Nhưng nếu chưa có Performance:
// → chỉ dùng Style Match.
//
// =======================================

export function scoreContent(
    content = "",
    style = {},
    metrics = null
) {

    const styleScore =
        scoreStyleMatch(
            content,
            style
        );


    const hasPerformanceData =
        metrics &&
        Object.values(
            metrics
        ).some(
            (value) =>
                Number(value) > 0
        );


    if (
        !hasPerformanceData
    ) {

        return {

            styleMatchScore:
                styleScore,

            performanceScore:
                0,

            combinedScore:
                styleScore,

            performanceAvailable:
                false,

        };

    }


    const performanceScore =
        scorePerformance(
            metrics
        );


    const combinedScore =
        Math.round(
            styleScore * 0.4 +
            performanceScore * 0.6
        );


    return {

        styleMatchScore:
            styleScore,

        performanceScore:
            performanceScore,

        combinedScore:
            combinedScore,

        performanceAvailable:
            true,

    };

}


// =======================================
// CLASSIFY PERFORMANCE
// =======================================

export function classifyPerformance(
    score = 0
) {

    const value =
        Number(score) || 0;


    if (value >= 80) {

        return {
            level: "high",
            label: "🔥 Hiệu quả cao",
        };

    }


    if (value >= 60) {

        return {
            level: "good",
            label: "🟢 Hiệu quả tốt",
        };

    }


    if (value >= 40) {

        return {
            level: "average",
            label: "🟡 Trung bình",
        };

    }


    if (value > 0) {

        return {
            level: "low",
            label: "🔴 Hiệu quả thấp",
        };

    }


    return {
        level: "unknown",
        label: "⚪ Chưa có dữ liệu",
    };

}