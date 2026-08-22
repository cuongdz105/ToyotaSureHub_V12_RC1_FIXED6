import { mockAI } from "../mockAI";

export async function generate(prompt, car) {
    return mockAI(prompt, car);
}