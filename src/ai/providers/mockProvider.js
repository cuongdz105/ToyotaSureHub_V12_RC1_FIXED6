import { mockAI } from "../engine/mockAI";

export async function generate(prompt, car, options = {}) {
  return await mockAI(prompt, car, options);
}
