import { zodTextFormat } from "openai/helpers/zod";
import { getOpenAIClient, OPENAI_MODEL } from "./client";
import { SEARCH_PROMPT } from "./prompts";
import { searchIntentSchema } from "./schemas";
import { keywordFallback } from "./search-fallback";
export { keywordFallback } from "./search-fallback";
export async function parseSearchIntent(query: string) {
  try {
    const response = await getOpenAIClient().responses.parse({
      model: OPENAI_MODEL,
      instructions: SEARCH_PROMPT,
      input: query.slice(0, 500),
      max_output_tokens: 500,
      text: {
        format: zodTextFormat(searchIntentSchema, "procurement_search_intent"),
      },
    });
    const parsed = searchIntentSchema.safeParse(response.output_parsed);
    return parsed.success ? parsed.data : keywordFallback(query);
  } catch {
    return keywordFallback(query);
  }
}
