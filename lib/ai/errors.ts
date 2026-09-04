export type SafeAiError = { type: string; message: string; status?: number };

export function safeAiError(error: unknown): SafeAiError {
  const value = error && typeof error === "object" ? error as Record<string, unknown> : {};
  const status = typeof value.status === "number" ? value.status : undefined;
  const code = typeof value.code === "string" ? value.code : undefined;
  const name = error instanceof Error ? error.name : "Error";
  const raw = error instanceof Error ? error.message : "";
  if (status === 401) return { type: "unauthorized", message: "OpenAI rejected the configured credentials.", status };
  if (status === 429) return { type: "rate_limited", message: "OpenAI rate limit reached.", status };
  if (/model.*(not found|does not exist)|model_not_found/i.test(raw) || code === "model_not_found") return { type: "model_not_found", message: "The configured AI model is unavailable.", status };
  if (/validated|structured|schema/i.test(raw)) return { type: "invalid_structured_output", message: "The AI response did not match the required structure.", status };
  if (name === "AbortError" || /timeout|timed out/i.test(raw) || code === "ETIMEDOUT") return { type: "timeout", message: "The AI request timed out.", status };
  return { type: "openai_error", message: "AI analysis could not be generated.", status };
}

export function publicAiErrorMessage(error: SafeAiError) {
  if (error.type === "timeout" || error.type === "rate_limited") return "AI analysis is temporarily unavailable. Please try again later.";
  if (error.type === "invalid_structured_output") return "AI analysis could not be completed safely. Please try again.";
  return "AI analysis is unavailable. Please contact support if this continues.";
}
