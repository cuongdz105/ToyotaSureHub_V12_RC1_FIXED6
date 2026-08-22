// =======================================
// Toyota Memory Engine
// =======================================

const memories = [];

export function addMemory(memory) {
    memories.push(memory);
}

export function getMemories() {
    return memories;
}

export function clearMemories() {
    memories.length = 0;
}