import { generate } from "./providers/mockProvider";

export async function generateAI(prompt, car) {
  return await generate(prompt, car);
}