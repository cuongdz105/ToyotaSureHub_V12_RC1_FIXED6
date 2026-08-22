import { loadMemory } from "./memoryEngine";

export function buildMemoryPrompt() {

    const memory = loadMemory();

    if (memory.length === 0) {
        return "";
    }

    const memories = memory
        .slice(0, 5)
        .map((item, index) => {
            return `
${index + 1}.
Loại: ${item.type}
Xe: ${item.car}

Nội dung đã tạo:
${item.summary}
`;
        })
        .join("\n");

    return `
========================
AI MEMORY
========================

Đây là các nội dung đã từng tạo trước đó.

KHÔNG được lặp lại ý tưởng, tiêu đề, mở bài hoặc cách diễn đạt.

${memories}

========================
KẾT THÚC AI MEMORY
========================
`;
}