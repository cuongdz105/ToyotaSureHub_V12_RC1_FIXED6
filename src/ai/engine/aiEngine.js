// =======================================
// Toyota AI Engine
// =======================================

import { AI_PROVIDER } from "./config";
import { providers } from "./registry";

export async function runAI(prompt, car, options = {}) {
    return providers[AI_PROVIDER].generate(prompt, car, options);
}
