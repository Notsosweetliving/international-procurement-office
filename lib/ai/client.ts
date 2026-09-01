import OpenAI from "openai";
export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-5-mini";
export class AiUnavailableError extends Error {
  constructor() {
    super(
      "AI features are unavailable because OPENAI_API_KEY is not configured.",
    );
  }
}
export function isAiAvailable() {
  return Boolean(process.env.OPENAI_API_KEY);
}
export function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) throw new AiUnavailableError();
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 20000,
    maxRetries: 1,
  });
}
