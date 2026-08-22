// ==========================================
// ToyotaSureHub V11
// Content Research Prompt Service
// ==========================================
//
// Nhiệm vụ:
//
// Chuyển Research Pack thành context có cấu trúc
// để AI dùng khi tạo content.
//
// NGUYÊN TẮC:
//
// 1. Không copy nguyên văn bài mẫu.
// 2. Chỉ học structure / style / pattern.
// 3. Không đưa thông tin sai từ bài mẫu sang xe mới.
// 4. Không tự lấy giá / ODO / thông tin xe mẫu.
// 5. Không biến bài quảng cáo thành mẫu organic.
// 6. Nếu adStatus = unknown thì giữ unknown.
// 7. Nội dung cuối cùng phải dựa trên dữ liệu xe thật.
//
// ==========================================

import {
    buildResearchPack,
} from "./contentResearchService";


// ==========================================
// DEFAULT OPTIONS
// ==========================================

const DEFAULT_OPTIONS = {

    limit:
        5,

    includeUnknownAds:
        true,

    includeScreenshots:
        false,

};


// ==========================================
// SAFE TEXT
// ==========================================

function safeText(
    value,
    fallback = ""
) {

    if (
        value === null ||
        value === undefined
    ) {

        return fallback;

    }


    return String(
        value
    ).trim();

}


// ==========================================
// FORMAT TAGS
// ==========================================

function formatTags(
    tags
) {

    if (
        !Array.isArray(
            tags
        ) ||
        tags.length === 0
    ) {

        return "Không có";

    }


    return tags
        .map(
            (tag) =>
                `- ${tag}`
        )
        .join("\n");

}


// ==========================================
// FORMAT ENGAGEMENT
// ==========================================

function formatEngagement(
    engagement
) {

    if (!engagement) {

        return "Không có dữ liệu";

    }


    const likes =
        engagement.likes ??
        0;


    const comments =
        engagement.comments ??
        0;


    const shares =
        engagement.shares ??
        0;


    return [
        `Like: ${likes}`,
        `Comment: ${comments}`,
        `Share: ${shares}`,
    ].join(
        " | "
    );

}


// ==========================================
// FORMAT AD STATUS
// ==========================================

function formatAdStatus(
    item
) {

    const status =
        item.adStatus ||
        "unknown";


    if (
        status === "paid"
    ) {

        return [
            "Trạng thái: CÓ DẤU HIỆU QUẢNG CÁO",
            `Độ tin cậy: ${
                typeof item.adConfidence === "number"
                    ? Math.round(
                        item.adConfidence * 100
                    )
                    : "không rõ"
            }%`,
            "Không dùng bài này làm mẫu organic.",
        ].join(
            "\n"
        );

    }


    if (
        status === "organic"
    ) {

        return [
            "Trạng thái: ORGANIC",
            "Có thể dùng làm nguồn tham khảo organic.",
        ].join(
            "\n"
        );

    }


    return [
        "Trạng thái: CHƯA XÁC ĐỊNH",
        "Không được tự kết luận đây là bài organic.",
    ].join(
        "\n"
    );

}


// ==========================================
// FORMAT STYLE
// ==========================================

function formatStyle(
    item
) {

    const style =
        item.styleDNA ||
        item.analysis?.style?.tags ||
        [];


    if (
        !Array.isArray(
            style
        ) ||
        style.length === 0
    ) {

        return "Chưa phân tích";

    }


    return style.join(
        ", "
    );

}


// ==========================================
// FORMAT HOOK
// ==========================================

function formatHook(
    item
) {

    const hook =
        item.analysis?.hook;


    if (!hook) {

        return "Chưa phân tích";

    }


    return [
        `Loại hook: ${
            safeText(
                hook.type,
                "unknown"
            )
        }`,
        `Câu hook: ${
            safeText(
                hook.text,
                "Không có"
            )
        }`,
    ].join(
        "\n"
    );

}


// ==========================================
// FORMAT STRUCTURE
// ==========================================

function formatStructure(
    item
) {

    const structure =
        item.analysis?.structure;


    if (!structure) {

        return "Chưa phân tích";

    }


    return [
        `Pattern: ${
            safeText(
                structure.pattern,
                "unknown"
            )
        }`,
        `Các phần: ${
            Array.isArray(
                structure.uniqueSections
            )
                ? structure.uniqueSections.join(
                    " → "
                )
                : "Không có"
        }`,
    ].join(
        "\n"
    );

}


// ==========================================
// FORMAT CTA
// ==========================================

function formatCTA(
    item
) {

    const cta =
        item.analysis?.cta;


    if (!cta) {

        return "Chưa phân tích";

    }


    if (
        !cta.detected
    ) {

        return "Không phát hiện CTA";

    }


    return [
        "Có CTA",
        `Dạng CTA: ${
            Array.isArray(
                cta.patterns
            )
                ? cta.patterns.join(
                    ", "
                )
                : "Không rõ"
        }`,
    ].join(
        "\n"
    );

}


// ==========================================
// FORMAT VISUAL
// ==========================================

function formatVisual(
    item
) {

    const screenshots =
        Array.isArray(
            item.screenshots
        )
            ? item.screenshots.length
            : 0;


    return [
        `Số screenshot: ${screenshots}`,
        "Visual chi tiết: chưa phân tích bằng Vision AI.",
    ].join(
        "\n"
    );

}


// ==========================================
// BUILD ONE REFERENCE
// ==========================================

function buildReferenceBlock(
    item,
    index,
    options
) {

    const blocks = [];


    blocks.push(
        `===== BÀI THAM KHẢO ${index + 1} =====`
    );


    blocks.push(
        `ID: ${
            safeText(
                item.id,
                "unknown"
            )
        }`
    );


    blocks.push(
        `Nguồn: ${
            safeText(
                item.source,
                "Không rõ"
            )
        }`
    );


    blocks.push(
        formatAdStatus(
            item
        )
    );


    blocks.push(
        `Engagement: ${
            formatEngagement(
                item.engagement
            )
        }`
    );


    blocks.push(
        `Research score: ${
            Number(
                item.researchScore ||
                0
            ).toFixed(3)
        }`
    );


    blocks.push(
        `Tags:\n${
            formatTags(
                item.tags
            )
        }`
    );


    blocks.push(
        `Style:\n${
            formatStyle(
                item
            )
        }`
    );


    blocks.push(
        `Hook:\n${
            formatHook(
                item
            )
        }`
    );


    blocks.push(
        `Structure:\n${
            formatStructure(
                item
            )
        }`
    );


    blocks.push(
        `CTA:\n${
            formatCTA(
                item
            )
        }`
    );


    blocks.push(
        `Visual:\n${
            formatVisual(
                item
            )
        }`
    );


    if (
        item.note
    ) {

        blocks.push(
            `Ghi chú người dùng:\n${
                safeText(
                    item.note
                )
            }`
        );

    }


    // =====================================
    // QUAN TRỌNG:
    // KHÔNG đưa toàn bộ nội dung bài mẫu
    // vào prompt mặc định.
    //
    // Chỉ đưa khi explicit enable.
    // =====================================

    if (
        options.includeReferenceText
    ) {

        blocks.push(
            `Nội dung tham khảo:\n${
                safeText(
                    item.content
                )
            }`
        );

    }


    return blocks.join(
        "\n\n"
    );

}


// ==========================================
// BUILD RESEARCH CONTEXT
// ==========================================

export async function buildResearchContext(
    target = {},
    options = {}
) {

    const config = {

        ...DEFAULT_OPTIONS,

        ...options,

    };


    const pack =
        await buildResearchPack(
            target,
            config.limit
        );


    const references =
        Array.isArray(
            pack.references
        )
            ? pack.references
            : [];


    const filtered =
        config.includeUnknownAds

            ? references

            : references.filter(
                (item) =>
                    item.adStatus !==
                    "unknown"
            );


    const referenceBlocks =
        filtered.map(
            (
                item,
                index
            ) =>
                buildReferenceBlock(
                    item,
                    index,
                    config
                )
        );


    return {

        target:
            pack.target,

        referenceCount:
            filtered.length,

        references:
            filtered,

        text:
            referenceBlocks.join(
                "\n\n"
            ),

    };

}


// ==========================================
// BUILD AI INSTRUCTION
// ==========================================
//
// Đây là phần quan trọng nhất.
//
// Nó nói cho AI:
//
// "Hãy học cách làm,
// đừng copy bài."
//
// ==========================================

export function buildResearchInstruction(
    options = {}
) {

    const config = {

        ...DEFAULT_OPTIONS,

        ...options,

    };


    const rules = [

        "Bạn đang sử dụng một thư viện bài viết tham khảo.",

        "Các bài tham khảo chỉ dùng để nghiên cứu phong cách, cấu trúc, hook, CTA và pattern.",

        "Không sao chép nguyên văn bài tham khảo.",

        "Không sao chép câu chữ đặc trưng của một bài nếu không cần thiết.",

        "Không lấy giá, ODO, màu xe, phiên bản hoặc thông tin sản phẩm từ bài tham khảo để gán sang xe hiện tại.",

        "Mọi thông tin về chiếc xe hiện tại phải lấy từ dữ liệu xe thật được cung cấp trong prompt.",

        "Nếu một bài có trạng thái paid thì không dùng bài đó làm mẫu organic.",

        "Nếu một bài có trạng thái unknown thì không được tự kết luận bài đó là organic.",

        "Ưu tiên những pattern có dấu hiệu tạo tương tác tốt.",

        "Có thể kết hợp nhiều pattern từ nhiều bài khác nhau.",

        "Không bắt chước nguyên xi một bài duy nhất.",

        "Nội dung cuối cùng phải tự nhiên và phù hợp với thương hiệu Toyota Sure.",

    ];


    if (
        config.includeScreenshots
    ) {

        rules.push(
            "Nếu có screenshot, dùng hình ảnh để tham khảo thêm bố cục và cách trình bày."
        );

    }


    return [

        "===== QUY TẮC RESEARCH CONTENT =====",

        ...rules.map(
            (rule) =>
                `- ${rule}`
        ),

    ].join(
        "\n"
    );

}


// ==========================================
// BUILD FULL AI CONTEXT
// ==========================================

export async function buildAIResearchContext(
    target = {},
    options = {}
) {

    const context =
        await buildResearchContext(
            target,
            options
        );


    const instruction =
        buildResearchInstruction(
            options
        );


    return {

        target:
            context.target,

        referenceCount:
            context.referenceCount,

        references:
            context.references,

        instruction,

        researchText:
            context.text,

    };

}


// ==========================================
// BUILD CONTENT PROMPT BLOCK
// ==========================================
//
// Có thể nhúng trực tiếp vào promptBuilder
// sau này.
//

export async function buildResearchPromptBlock(
    target = {},
    options = {}
) {

    const result =
        await buildAIResearchContext(
            target,
            options
        );


    return [

        result.instruction,

        "",

        "===== TARGET =====",

        JSON.stringify(
            result.target,
            null,
            2
        ),

        "",

        "===== RESEARCH REFERENCES =====",

        result.researchText ||
            "Chưa có bài tham khảo phù hợp.",

    ].join(
        "\n"
    );

}


// ==========================================
// DEBUG
// ==========================================

export async function previewResearchPrompt(
    target = {},
    options = {}
) {

    return buildResearchPromptBlock(
        target,
        {

            limit:
                options.limit ||
                5,

            includeUnknownAds:
                options.includeUnknownAds ??
                true,

            includeReferenceText:
                options.includeReferenceText ??
                false,

            includeScreenshots:
                options.includeScreenshots ??
                false,

        }
    );

}


// ==========================================
// DEFAULT EXPORT
// ==========================================

export default {

    buildResearchContext,

    buildResearchInstruction,

    buildAIResearchContext,

    buildResearchPromptBlock,

    previewResearchPrompt,

};