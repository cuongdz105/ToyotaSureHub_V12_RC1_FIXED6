import { AI_CONFIG } from "../ai/config";

export function getAIProvider() {
  return AI_CONFIG.provider;
}

export function setAIProvider(provider) {
  AI_CONFIG.provider = provider;
}