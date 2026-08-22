import { mockAI } from "../engine/mockAI";

export async function generate(prompt, car) {
  return await mockAI(prompt, car);
}