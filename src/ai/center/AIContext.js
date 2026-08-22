export function createAIContext(car, type) {
    return {
        id: crypto.randomUUID(),

        type,

        car,

        provider: "openai",

        model: "gpt-5.5",

        prompt: "",

        result: "",

        startedAt: Date.now(),

        finishedAt: null,

        duration: 0,
    };
}