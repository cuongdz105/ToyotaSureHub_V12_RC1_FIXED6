const STORAGE_KEY = "toyota_ai_memory";

export function loadMemory() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

export function saveMemory(memory) {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(memory)
    );
}

export function addMemory(item) {

    const memory = loadMemory();

    memory.unshift({
        id: Date.now(),
        ...item
    });

    saveMemory(memory);
}

export function clearMemory() {
    localStorage.removeItem(STORAGE_KEY);
}