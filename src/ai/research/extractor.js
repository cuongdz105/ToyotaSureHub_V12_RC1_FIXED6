// =======================================
// ToyotaSureHub V11
// Style Research - Extractor
// =======================================
//
// Nhiệm vụ:
// - Nhận kết quả thô từ AI
// - Trích xuất JSON an toàn
// - Chuẩn hóa các field của Style DNA
// - Không làm app crash nếu AI trả JSON lỗi
//
// =======================================


// =======================================
// STYLE DNA MẶC ĐỊNH
// =======================================

function createEmptyStyle() {

    return {

        hookStyle: "",

        engagementPattern: "",

        tone: "",

        sentenceLength: "",

        paragraphStyle: "",

        emojiUsage: "",

        structure: [],

        ctaStyle: "",

        hashtagUsage: "",

        commonPhrases: [],

        avoidPatterns: [],

        summary: "",

    };

}


// =======================================
// CHUẨN HÓA ARRAY
// =======================================

function normalizeArray(value) {

    if (Array.isArray(value)) {

        return value
            .filter(Boolean)
            .map((item) =>
                String(item).trim()
            )
            .filter(Boolean);

    }


    if (
        typeof value === "string" &&
        value.trim()
    ) {

        return [
            value.trim()
        ];

    }


    return [];

}


// =======================================
// TÌM JSON TRONG AI RESPONSE
// =======================================

function extractJsonText(text) {

    if (
        typeof text !== "string"
    ) {

        return null;

    }


    const cleaned =
        text
            .trim()
            .replace(
                /^```json/i,
                ""
            )
            .replace(
                /^```/i,
                ""
            )
            .replace(
                /```$/i,
                ""
            )
            .trim();


    // ---------------------------------------
    // Trường hợp AI trả JSON thuần
    // ---------------------------------------

    if (
        cleaned.startsWith("{") &&
        cleaned.endsWith("}")
    ) {

        return cleaned;

    }


    // ---------------------------------------
    // Trường hợp AI giải thích rồi mới trả JSON
    // ---------------------------------------

    const start =
        cleaned.indexOf("{");

    const end =
        cleaned.lastIndexOf("}");


    if (
        start !== -1 &&
        end !== -1 &&
        end > start
    ) {

        return cleaned.slice(
            start,
            end + 1
        );

    }


    return null;

}


// =======================================
// EXTRACT STYLE DNA
// =======================================

export function extractStyle(
    rawResult
) {

    const emptyStyle =
        createEmptyStyle();


    if (!rawResult) {

        return emptyStyle;

    }


    let parsed = null;


    // ---------------------------------------
    // Nếu AI đã trả object
    // ---------------------------------------

    if (
        typeof rawResult === "object" &&
        !Array.isArray(rawResult)
    ) {

        parsed =
            rawResult;

    }


    // ---------------------------------------
    // Nếu AI trả string
    // ---------------------------------------

    if (
        typeof rawResult === "string"
    ) {

        const jsonText =
            extractJsonText(
                rawResult
            );


        if (!jsonText) {

            console.warn(
                "Toyota Research: Không tìm thấy JSON trong AI response."
            );

            return emptyStyle;

        }


        try {

            parsed =
                JSON.parse(
                    jsonText
                );

        } catch (error) {

            console.error(
                "Toyota Research: JSON không hợp lệ:",
                error
            );

            return emptyStyle;

        }

    }


    if (!parsed) {

        return emptyStyle;

    }


    // =======================================
    // CHUẨN HÓA KẾT QUẢ
    // =======================================

    return {

        hookStyle:
            parsed.hookStyle
                ? String(
                    parsed.hookStyle
                ).trim()
                : "",


        engagementPattern:
            parsed.engagementPattern
                ? String(
                    parsed.engagementPattern
                ).trim()
                : "",


        tone:
            parsed.tone
                ? String(
                    parsed.tone
                ).trim()
                : "",


        sentenceLength:
            parsed.sentenceLength
                ? String(
                    parsed.sentenceLength
                ).trim()
                : "",


        paragraphStyle:
            parsed.paragraphStyle
                ? String(
                    parsed.paragraphStyle
                ).trim()
                : "",


        emojiUsage:
            parsed.emojiUsage
                ? String(
                    parsed.emojiUsage
                ).trim()
                : "",


        structure:
            normalizeArray(
                parsed.structure
            ),


        ctaStyle:
            parsed.ctaStyle
                ? String(
                    parsed.ctaStyle
                ).trim()
                : "",


        hashtagUsage:
            parsed.hashtagUsage
                ? String(
                    parsed.hashtagUsage
                ).trim()
                : "",


        commonPhrases:
            normalizeArray(
                parsed.commonPhrases
            ),


        avoidPatterns:
            normalizeArray(
                parsed.avoidPatterns
            ),


        summary:
            parsed.summary
                ? String(
                    parsed.summary
                ).trim()
                : "",

    };

}


// =======================================
// KIỂM TRA STYLE DNA
// =======================================

export function isValidStyle(
    style
) {

    if (
        !style ||
        typeof style !== "object"
    ) {

        return false;

    }


    const hasCoreField =
        Boolean(
            style.hookStyle ||
            style.tone ||
            style.engagementPattern ||
            style.summary
        );


    return hasCoreField;

}