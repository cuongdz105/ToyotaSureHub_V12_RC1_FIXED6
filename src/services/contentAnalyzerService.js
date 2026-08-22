// ==========================================
// ToyotaSureHub V11
// Content Analyzer Service
// ==========================================
//
// Nhiệm vụ:
//
// Phân tích một bài mẫu trong Content Library:
//
// - Hook
// - Cấu trúc
// - Văn phong
// - Độ dài
// - Emoji
// - CTA
// - Giá
// - ODO
// - Hashtag
// - Cách xuống dòng
// - Pattern
// - Engagement
// - Ad status
//
// V1:
// Không gọi AI API.
// Phân tích bằng rule-based engine.
//
// V2:
// Có thể thay / bổ sung AI Vision + LLM.
//
// ==========================================

import {
    getContentSample,
    updateContentSample,
} from "./contentLibraryService";


// ==========================================
// CONSTANTS
// ==========================================

const CTA_PATTERNS = [

    "liên hệ",
    "ib",
    "inbox",
    "nhắn tin",
    "gọi ngay",
    "gọi",
    "hotline",
    "zalo",
    "đăng ký",
    "tư vấn",
    "quan tâm",
    "xem xe",
    "thử xe",

];


const PRICE_PATTERNS = [

    /\b\d+\s*(?:xx|xxx)\b/gi,

    /\b\d+(?:[.,]\d+)?\s*(?:tr|triệu|tỷ|tỉ)\b/gi,

    /\bgiá\s*[:\-]?\s*[\d.,]+/gi,

    /(?:chỉ|chỉ còn|giá bán)\s*[\d.,]+\s*(?:tr|triệu|tỷ|tỉ)/gi,

];


const ODO_PATTERNS = [

    /\b\d+(?:[.,]\d+)?\s*vạn\s*(?:km)?\b/gi,

    /\b\d{1,3}(?:[.,]\d{3})+\s*km\b/gi,

    /\b\d+\s*km\b/gi,

];


const HASHTAG_PATTERN =
    /#[\p{L}\p{N}_]+/gu;


const EMOJI_PATTERN =
    /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;


// ==========================================
// NORMALIZE TEXT
// ==========================================

function normalizeText(
    text
) {

    return String(
        text || ""
    )
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .trim();

}


// ==========================================
// WORD COUNT
// ==========================================

function getWordCount(
    text
) {

    const normalized =
        normalizeText(
            text
        );


    if (!normalized) {
        return 0;
    }


    return normalized
        .split(/\s+/)
        .filter(Boolean)
        .length;

}


// ==========================================
// CHARACTER COUNT
// ==========================================

function getCharacterCount(
    text
) {

    return normalizeText(
        text
    ).length;

}


// ==========================================
// LINE ANALYSIS
// ==========================================

function getLineAnalysis(
    text
) {

    const lines =
        normalizeText(
            text
        )
            .split("\n");


    const nonEmptyLines =
        lines.filter(
            (line) =>
                line.trim()
        );


    return {

        total:
            lines.length,

        nonEmpty:
            nonEmptyLines.length,

        empty:
            lines.length -
            nonEmptyLines.length,

        averageCharacters:
            nonEmptyLines.length
                ? Math.round(
                    nonEmptyLines.reduce(
                        (
                            total,
                            line
                        ) =>
                            total +
                            line.length,
                        0
                    ) /
                    nonEmptyLines.length
                )
                : 0,

        shortLines:
            nonEmptyLines.filter(
                (line) =>
                    line.trim().length <= 35
            ).length,

        longLines:
            nonEmptyLines.filter(
                (line) =>
                    line.trim().length >= 100
            ).length,

    };

}


// ==========================================
// SENTENCE ANALYSIS
// ==========================================

function getSentenceAnalysis(
    text
) {

    const normalized =
        normalizeText(
            text
        );


    if (!normalized) {

        return {

            count: 0,

            averageLength: 0,

        };

    }


    const sentences =
        normalized
            .split(
                /[.!?。！？]+/
            )
            .map(
                (sentence) =>
                    sentence.trim()
            )
            .filter(Boolean);


    const averageLength =
        sentences.length
            ? Math.round(
                sentences.reduce(
                    (
                        total,
                        sentence
                    ) =>
                        total +
                        sentence.length,
                    0
                ) /
                sentences.length
            )
            : 0;


    return {

        count:
            sentences.length,

        averageLength,

    };

}


// ==========================================
// EMOJI ANALYSIS
// ==========================================

function analyzeEmoji(
    text
) {

    const matches =
        normalizeText(
            text
        ).match(
            EMOJI_PATTERN
        ) || [];


    const unique =
        [
            ...new Set(
                matches
            ),
        ];


    return {

        count:
            matches.length,

        unique:
            unique.length,

        list:
            unique.slice(
                0,
                20
            ),

        density:
            getCharacterCount(
                text
            ) > 0
                ? matches.length /
                  getCharacterCount(
                      text
                  )
                : 0,

    };

}


// ==========================================
// HASHTAG ANALYSIS
// ==========================================

function analyzeHashtags(
    text
) {

    const matches =
        normalizeText(
            text
        ).match(
            HASHTAG_PATTERN
        ) || [];


    return {

        count:
            matches.length,

        list:
            [
                ...new Set(
                    matches
                ),
            ],

    };

}


// ==========================================
// CTA ANALYSIS
// ==========================================

function analyzeCTA(
    text
) {

    const normalized =
        normalizeText(
            text
        ).toLowerCase();


    const found = [];


    CTA_PATTERNS.forEach(
        (pattern) => {

            if (
                normalized.includes(
                    pattern
                )
            ) {

                found.push(
                    pattern
                );

            }

        }
    );


    return {

        detected:
            found.length > 0,

        count:
            found.length,

        patterns:
            found,

    };

}


// ==========================================
// PRICE ANALYSIS
// ==========================================

function analyzePrice(
    text
) {

    const normalized =
        normalizeText(
            text
        );


    const found = [];


    PRICE_PATTERNS.forEach(
        (pattern) => {

            const matches =
                normalized.match(
                    pattern
                ) || [];


            found.push(
                ...matches
            );

        }
    );


    return {

        detected:
            found.length > 0,

        examples:
            [
                ...new Set(
                    found
                ),
            ].slice(
                0,
                20
            ),

    };

}


// ==========================================
// ODO ANALYSIS
// ==========================================

function analyzeOdo(
    text
) {

    const normalized =
        normalizeText(
            text
        );


    const found = [];


    ODO_PATTERNS.forEach(
        (pattern) => {

            const matches =
                normalized.match(
                    pattern
                ) || [];


            found.push(
                ...matches
            );

        }
    );


    return {

        detected:
            found.length > 0,

        examples:
            [
                ...new Set(
                    found
                ),
            ].slice(
                0,
                20
            ),

    };

}


// ==========================================
// HOOK ANALYSIS
// ==========================================
//
// Rule-based:
//
// Ưu tiên dòng đầu tiên
// hoặc đoạn đầu tiên.
//
// ==========================================

function analyzeHook(
    text
) {

    const normalized =
        normalizeText(
            text
        );


    if (!normalized) {

        return {

            detected:
                false,

            text:
                "",

            type:
                "none",

        };

    }


    const lines =
        normalized
            .split("\n")
            .map(
                (line) =>
                    line.trim()
            )
            .filter(Boolean);


    const firstLine =
        lines[0] || "";


    let type =
        "statement";


    if (
        /[!?]/.test(
            firstLine
        )
    ) {

        type =
            "question_or_exclamation";

    }


    if (
        /^(các bác|anh chị|bác|mọi người|ai|có ai)/i.test(
            firstLine
        )
    ) {

        type =
            "audience_callout";

    }


    if (
        /(chỉ|sốc|bất ngờ|đừng|đừng bỏ lỡ|siêu|cực|quá)/i.test(
            firstLine
        )
    ) {

        type =
            "attention_grabber";

    }


    if (
        /(xe|toyota|vios|yaris|altis|camry|cross|fortuner|innova)/i.test(
            firstLine
        )
    ) {

        type =
            "product_first";

    }


    return {

        detected:
            true,

        text:
            firstLine,

        type,

        length:
            firstLine.length,

    };

}


// ==========================================
// STRUCTURE ANALYSIS
// ==========================================

function analyzeStructure(
    text
) {

    const normalized =
        normalizeText(
            text
        );


    const lines =
        normalized
            .split("\n")
            .map(
                (line) =>
                    line.trim()
            )
            .filter(Boolean);


    if (
        lines.length === 0
    ) {

        return {

            sections: [],

            pattern:
                "empty",

        };

    }


    const sections = [];


    let currentType =
        "body";


    lines.forEach(
        (line, index) => {

            if (
                index === 0
            ) {

                sections.push(
                    "hook"
                );

                currentType =
                    "body";

                return;

            }


            if (
                /^(thông tin|thông số|chi tiết|option|trang bị)/i.test(
                    line
                )
            ) {

                sections.push(
                    "specifications"
                );

                currentType =
                    "specifications";

                return;

            }


            if (
                /(liên hệ|ib|inbox|zalo|gọi|nhắn tin|tư vấn)/i.test(
                    line
                )
            ) {

                sections.push(
                    "cta"
                );

                currentType =
                    "cta";

                return;

            }


            if (
                /^(#|📍|📞|☎️|👉|🔥|🚗|✅)/u.test(
                    line
                )
            ) {

                sections.push(
                    "highlight"
                );

                currentType =
                    "highlight";

                return;

            }


            sections.push(
                currentType
            );

        }
    );


    const uniqueSections =
        [
            ...new Set(
                sections
            ),
        ];


    let pattern =
        "hook_body";


    if (
        uniqueSections.includes(
            "cta"
        )
    ) {

        pattern +=
            "_cta";

    }


    if (
        uniqueSections.includes(
            "specifications"
        )
    ) {

        pattern +=
            "_spec";

    }


    return {

        sections,

        uniqueSections,

        pattern,

        sectionCount:
            uniqueSections.length,

    };

}


// ==========================================
// STYLE ANALYSIS
// ==========================================

function analyzeStyle(
    text
) {

    const wordCount =
        getWordCount(
            text
        );


    const lineAnalysis =
        getLineAnalysis(
            text
        );


    const sentenceAnalysis =
        getSentenceAnalysis(
            text
        );


    const emoji =
        analyzeEmoji(
            text
        );


    const hashtags =
        analyzeHashtags(
            text
        );


    const cta =
        analyzeCTA(
            text
        );


    const style = [];


    // ==============================
    // LENGTH
    // ==============================

    if (
        wordCount < 80
    ) {

        style.push(
            "ngắn_gọn"
        );

    } else if (
        wordCount < 180
    ) {

        style.push(
            "độ_dài_vừa"
        );

    } else {

        style.push(
            "chi_tiết"
        );

    }


    // ==============================
    // LINE STYLE
    // ==============================

    if (
        lineAnalysis.shortLines >=
        lineAnalysis.nonEmpty *
        0.6
    ) {

        style.push(
            "nhiều_dòng_ngắn"
        );

    }


    if (
        lineAnalysis.longLines >=
        2
    ) {

        style.push(
            "nhiều_đoạn_dài"
        );

    }


    // ==============================
    // EMOJI
    // ==============================

    if (
        emoji.count === 0
    ) {

        style.push(
            "ít_emoji"
        );

    } else if (
        emoji.count <= 5
    ) {

        style.push(
            "emoji_vừa_phải"
        );

    } else {

        style.push(
            "nhiều_emoji"
        );

    }


    // ==============================
    // CTA
    // ==============================

    if (
        cta.detected
    ) {

        style.push(
            "có_cta"
        );

    } else {

        style.push(
            "không_cta"
        );

    }


    // ==============================
    // HASHTAG
    // ==============================

    if (
        hashtags.count === 0
    ) {

        style.push(
            "không_hashtag"
        );

    } else if (
        hashtags.count <= 5
    ) {

        style.push(
            "hashtag_vừa_phải"
        );

    } else {

        style.push(
            "nhiều_hashtag"
        );

    }


    // ==============================
    // SENTENCE
    // ==============================

    if (
        sentenceAnalysis.averageLength <=
        60
    ) {

        style.push(
            "câu_ngắn"
        );

    } else {

        style.push(
            "câu_dài"
        );

    }


    return {

        tags:
            style,

        wordCount,

        characterCount:
            getCharacterCount(
                text
            ),

        lineAnalysis,

        sentenceAnalysis,

    };

}


// ==========================================
// ENGAGEMENT ANALYSIS
// ==========================================

function analyzeEngagement(
    item
) {

    const likes =
        Number(
            item.engagement?.likes ||
            0
        );


    const comments =
        Number(
            item.engagement?.comments ||
            0
        );


    const shares =
        Number(
            item.engagement?.shares ||
            0
        );


    const score =
        likes +
        comments * 3 +
        shares * 5;


    return {

        likes,

        comments,

        shares,

        score,

        hasData:
            likes > 0 ||
            comments > 0 ||
            shares > 0,

    };

}


// ==========================================
// AD ANALYSIS
// ==========================================
//
// Không tự đoán paid nếu không có bằng chứng.
//
// Nếu service trước đó đã lưu:
// paid / organic / unknown
//
// thì giữ nguyên.
//
// ==========================================

function analyzeAdStatus(
    item
) {

    const status =
        item.adStatus ||
        "unknown";


    const confidence =
        typeof item.adConfidence ===
            "number"
            ? item.adConfidence
            : null;


    const evidence =
        Array.isArray(
            item.adEvidence
        )
            ? item.adEvidence
            : [];


    return {

        status,

        confidence,

        evidence,

    };

}


// ==========================================
// BUILD ANALYSIS
// ==========================================

export function analyzeContentSample(
    item
) {

    if (!item) {

        throw new Error(
            "Không có bài mẫu để phân tích."
        );

    }


    const text =
        normalizeText(
            item.content
        );


    const hook =
        analyzeHook(
            text
        );


    const structure =
        analyzeStructure(
            text
        );


    const style =
        analyzeStyle(
            text
        );


    const emoji =
        analyzeEmoji(
            text
        );


    const hashtags =
        analyzeHashtags(
            text
        );


    const cta =
        analyzeCTA(
            text
        );


    const price =
        analyzePrice(
            text
        );


    const odo =
        analyzeOdo(
            text
        );


    const engagement =
        analyzeEngagement(
            item
        );


    const ad =
        analyzeAdStatus(
            item
        );


    return {

        version:
            "1.0",


        analyzedAt:
            new Date().toISOString(),


        hook,


        structure,


        style,


        emoji,


        hashtags,


        cta,


        price,


        odo,


        engagement,


        ad,


        screenshots: {

            count:
                Array.isArray(
                    item.screenshots
                )
                    ? item.screenshots.length
                    : 0,

            available:
                Array.isArray(
                    item.screenshots
                ) &&
                item.screenshots.length >
                    0,

        },

    };

}


// ==========================================
// ANALYZE + SAVE
// ==========================================

export async function analyzeAndSaveContentSample(
    id
) {

    const item =
        await getContentSample(
            id
        );


    if (!item) {

        throw new Error(
            "Không tìm thấy bài mẫu."
        );

    }


    const analysis =
        analyzeContentSample(
            item
        );


    const updated =
        await updateContentSample(
            id,
            {

                analyzed:
                    true,

                analysis,

                styleDNA:
                    analysis.style.tags,

                score:
                    analysis.engagement.score,

                adStatus:
                    analysis.ad.status,

                adConfidence:
                    analysis.ad.confidence,

                adEvidence:
                    analysis.ad.evidence,

            }
        );


    return {

        item:
            updated,

        analysis,

    };

}


// ==========================================
// ANALYZE MULTIPLE
// ==========================================

export async function analyzeAllContentSamples() {

    const {
        getContentLibrary,
    } =
        await import(
            "./contentLibraryService"
        );


    const items =
        await getContentLibrary();


    const results = [];


    for (
        const item
        of items
    ) {

        try {

            const result =
                await analyzeAndSaveContentSample(
                    item.id
                );


            results.push(
                result
            );

        } catch (
            error
        ) {

            console.error(
                "Content Analyzer Error:",
                item.id,
                error
            );

        }

    }


    return results;

}


// ==========================================
// BUILD STYLE SUMMARY
// ==========================================
//
// Gom các pattern từ nhiều bài.
//
// Sau này AI sẽ dùng phần này để biết
// thư viện đang có những phong cách nào.
//

export async function buildStyleSummary() {

    const {
        getContentLibrary,
    } =
        await import(
            "./contentLibraryService"
        );


    const items =
        await getContentLibrary();


    const styleCount = {};


    items.forEach(
        (item) => {

            const tags =
                Array.isArray(
                    item.styleDNA
                )
                    ? item.styleDNA
                    : [];


            tags.forEach(
                (tag) => {

                    styleCount[tag] =
                        (
                            styleCount[tag] ||
                            0
                        ) + 1;

                }
            );

        }
    );


    return Object.entries(
        styleCount
    )
        .sort(
            (
                [, a],
                [, b]
            ) =>
                b - a
        )
        .map(
            (
                [style, count]
            ) => ({

                style,

                count,

            })
        );

}


// ==========================================
// DEFAULT EXPORT
// ==========================================

export default {

    analyzeContentSample,

    analyzeAndSaveContentSample,

    analyzeAllContentSamples,

    buildStyleSummary,

};