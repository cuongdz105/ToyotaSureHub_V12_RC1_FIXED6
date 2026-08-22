// =======================================
// ToyotaSureHub V11
// Content Research Engine
// =======================================
//
// Nhiệm vụ:
//
// 1. Phân tích các bài mẫu
// 2. Tạo Content DNA
// 3. Lưu Style DNA
// 4. Lấy Style DNA
// 5. Dùng Style DNA để tạo nội dung mới
//
// Luồng nghiên cứu:
//
// Bài mẫu
//    ↓
// Analyzer
//    ↓
// Extractor
//    ↓
// Style DNA
//    ↓
// Styles Storage
//
// Luồng tạo content:
//
// Car
//   +
// Style DNA
//   ↓
// AI
//   ↓
// Content mới
//
// =======================================

import {
    analyzeSamples,
} from "./analyzer";

import {
    extractStyle,
    isValidStyle,
} from "./extractor";

import {
    saveStyle,
    getStyles,
    getStyleById,
} from "./styles";

import {
    runAI,
} from "../engine/aiEngine";


// =======================================
// 1. NGHIÊN CỨU STYLE TỪ BÀI MẪU
// =======================================

export async function learnStyleFromSamples(
    samples = [],
    options = {}
) {

    if (
        !Array.isArray(samples) ||
        samples.length === 0
    ) {

        throw new Error(
            "Cần ít nhất 1 bài mẫu để nghiên cứu."
        );

    }


    // ---------------------------------------
    // Phân tích bằng AI
    // ---------------------------------------

    const rawResult =
        await analyzeSamples(
            samples
        );


    // ---------------------------------------
    // Extract JSON
    // ---------------------------------------

    const style =
        extractStyle(
            rawResult
        );


    if (
        !isValidStyle(style)
    ) {

        throw new Error(
            "AI không tạo được Style DNA hợp lệ."
        );

    }


    // ---------------------------------------
    // Lưu Style
    // ---------------------------------------

    const savedStyle =
        saveStyle({

            name:
                options.name ||
                `Content Style ${new Date().toLocaleDateString(
                    "vi-VN"
                )}`,

            category:
                options.category ||
                "facebook",

            style,

            sampleCount:
                samples.length,

            averageEngagement:
                options.averageEngagement ||
                0,

            topScore:
                options.topScore ||
                0,

            source:
                options.source ||
                "manual_research",

        });


    console.log(
        "🧠 Toyota Content Research: Đã lưu Style",
        savedStyle
    );


    return savedStyle;

}


// =======================================
// 2. LẤY DANH SÁCH STYLE
// =======================================

export function listLearnedStyles() {

    return getStyles();

}


// =======================================
// 3. LẤY STYLE THEO ID
// =======================================

export function getLearnedStyle(
    styleId
) {

    return getStyleById(
        styleId
    );

}


// =======================================
// 4. TẠO PROMPT DÙNG STYLE
// =======================================

function buildStyleGenerationPrompt(
    car,
    styleData,
    options = {}
) {

    const style =
        styleData?.style ||
        {};


    const platform =
        options.platform ||
        "Facebook";


    return `
Bạn là AI Content Writer của ToyotaSureHub.

Hãy viết một nội dung ${platform} mới cho chiếc xe
dưới đây.

THÔNG TIN XE:

Hãng:
${car?.brand || ""}

Dòng xe:
${car?.model || ""}

Phiên bản:
${car?.version || ""}

Năm:
${car?.year || ""}

Màu:
${car?.color || ""}

ODO:
${car?.odo || ""}

Giá:
${car?.price || ""}


CONTENT DNA ĐƯỢC HỌC:

Tên Style:
${styleData?.name || ""}

Hook:
${style.hookStyle || ""}

Pattern tạo tương tác:
${style.engagementPattern || ""}

Tone:
${style.tone || ""}

Độ dài câu:
${style.sentenceLength || ""}

Cách xuống dòng:
${style.paragraphStyle || ""}

Cách dùng emoji:
${style.emojiUsage || ""}

Cấu trúc:
${
    Array.isArray(style.structure)
        ? style.structure.join(" → ")
        : ""
}

CTA:
${style.ctaStyle || ""}

Hashtag:
${style.hashtagUsage || ""}

Đặc điểm ngôn ngữ:
${
    Array.isArray(style.commonPhrases)
        ? style.commonPhrases.join(", ")
        : ""
}

NÊN TRÁNH:
${
    Array.isArray(style.avoidPatterns)
        ? style.avoidPatterns.join(", ")
        : ""
}

Tóm tắt Content DNA:
${style.summary || ""}


NGUYÊN TẮC QUAN TRỌNG:

1. Không sao chép câu chữ của bất kỳ bài mẫu nào.

2. Chỉ sử dụng Content DNA như một định hướng
   về cấu trúc, giọng văn và cách tạo tương tác.

3. Nội dung phải được viết mới hoàn toàn.

4. Không tự bịa thông tin xe.

5. Nếu một thông tin xe không có dữ liệu,
   không được tự suy đoán.

6. Không đưa thông tin "Toyota Sure Mỹ Đình".
   Chỉ sử dụng tên chung "Toyota Sure" khi cần.

7. Không đưa giá bán chi tiết.

8. Nếu cần đề cập giá, chỉ sử dụng dạng:
   4xx / 5xx / 6xx...
   và hướng khách liên hệ.

9. Thông tin ODO đang được lưu theo đơn vị vạn km.
   Ví dụ:
   5.5 = 5,5 vạn km.

10. Nội dung phải tự nhiên, giống một người bán xe
    đang trò chuyện với khách hàng thật.

11. Không giải thích quá trình AI viết bài.

CHỈ TRẢ VỀ NỘI DUNG BÀI ĐĂNG.
`.trim();

}


// =======================================
// 5. VIẾT CONTENT THEO STYLE
// =======================================

export async function generateWithStyle(
    car,
    styleId,
    options = {}
) {

    if (!car) {

        throw new Error(
            "Thiếu thông tin xe."
        );

    }


    if (!styleId) {

        throw new Error(
            "Chưa chọn Content Style."
        );

    }


    const styleData =
        getStyleById(
            styleId
        );


    if (!styleData) {

        throw new Error(
            "Không tìm thấy Content Style."
        );

    }


    const prompt =
        buildStyleGenerationPrompt(
            car,
            styleData,
            options
        );


    console.log(
        "🤖 Toyota AI đang viết content theo Style:",
        styleData.name
    );


    const result =
        await runAI(
            prompt,
            car
        );


    return {

        result,

        styleId:
            styleData.id,

        styleName:
            styleData.name,

        prompt,

    };

}


// =======================================
// 6. DÙNG STYLE MỚI NHẤT
// =======================================

export async function generateWithLatestStyle(
    car,
    options = {}
) {

    const styles =
        getStyles();


    if (
        !styles.length
    ) {

        throw new Error(
            "Chưa có Content Style nào được nghiên cứu."
        );

    }


    const latestStyle =
        styles[0];


    return generateWithStyle(
        car,
        latestStyle.id,
        options
    );

}