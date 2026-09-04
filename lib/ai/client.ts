import OpenAI from "openai";
export const OPENAI_MODEL = process.env.OPENAI_MODEL?.trim() || "gpt-5-mini";
export class AiUnavailableError extends Error {
  constructor() {
    super(
      "AI analysis is not configured.",
    );
  }
}
export function isAiAvailable() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}
export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new AiUnavailableError();
  return new OpenAI({
    apiKey,
    timeout: 20000,
    maxRetries: 0,
  });
}
