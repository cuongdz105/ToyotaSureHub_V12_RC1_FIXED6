// =======================================
// Toyota Content Engine
// =======================================

import { loadKnowledge } from "../../knowledge/loader";
import { getMemories } from "./memoryEngine";

export function buildContext() {

    return {
        knowledge: loadKnowledge(),
        memories: getMemories(),
    };

}