// =======================================
// ToyotaSureHub V11
// Style Research - Analyzer
// =======================================
//
// Nhiệm vụ:
// - Nhận các bài mẫu
// - Gửi cho AI phân tích Content DNA
// - Không tự lưu dữ liệu
// - Không tự tạo Style
//
// Luồng:
//
// samples
//    ↓
// buildAnalysisPrompt()
//    ↓
// runAI()
//    ↓
// raw AI result
//    ↓
// extractor.js xử lý JSON
//
// =======================================

import { buildAnalysisPrompt } from "./patterns";
import { runAI } from "../engine/aiEngine";


// =======================================
// PHÂN TÍCH BÀI MẪU
// =======================================

export async function analyzeSamples(
    samples = []
) {

    if (
        !Array.isArray(samples) ||
        samples.length === 0
    ) {

        throw new Error(
            "Cần ít nhất 1 bài mẫu để phân tích."
        );

    }


    // ---------------------------------------
    // Build prompt
    // ---------------------------------------

    const prompt =
        buildAnalysisPrompt(
            samples
        );


    console.log(
        "🧠 Toyota Content Research đang phân tích:",
        samples.length,
        "bài mẫu"
    );


    // ---------------------------------------
    // Gọi Toyota AI Engine
    // ---------------------------------------

    const result =
        await runAI(
            prompt
        );


    console.log(
        "🧠 Content Research Result:",
        result
    );


    return result;

}