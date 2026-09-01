import { zodTextFormat } from "openai/helpers/zod";
import type { Opportunity } from "../opportunities/types";
import { getOpenAIClient, OPENAI_MODEL } from "./client";
import { opportunityContext } from "./context";
import { ANALYSIS_PROMPT } from "./prompts";
import { tenderAnalysisSchema, type TenderAnalysis } from "./schemas";
const cache = new Map<string, { expires: number; value: TenderAnalysis }>();
export async function analyzeTender(o: Opportunity) {
  const key = o.id + ":" + (o.publishedAt ?? "unknown");
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  const response = await getOpenAIClient().responses.parse({
    model: OPENAI_MODEL,
    instructions: ANALYSIS_PROMPT,
    input: opportunityContext(o),
    max_output_tokens: 3000,
    text: { format: zodTextFormat(tenderAnalysisSchema, "tender_analysis") },
  });
  const parsed = tenderAnalysisSchema.safeParse(response.output_parsed);
  if (!parsed.success)
    throw new Error("The AI response could not be validated.");
  cache.set(key, { value: parsed.data, expires: Date.now() + 21600000 });
  return parsed.data;
}
