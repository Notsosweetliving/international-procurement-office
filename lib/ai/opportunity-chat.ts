import type { CompanyProfile, Opportunity } from "../opportunities/types";
import type { CalculatedMatch } from "../matching/types";
import { getOpenAIClient, OPENAI_MODEL } from "./client";
import { chatContext } from "./context";
import { CHAT_PROMPT } from "./prompts";
import type { TenderAnalysis } from "./schemas";
export async function askOpportunity(
  question: string,
  o: Opportunity,
  p?: CompanyProfile | null,
  m?: CalculatedMatch | null,
  a?: TenderAnalysis,
  bidDocumentContext?: unknown,
) {
  const response = await getOpenAIClient().responses.create({
    model: OPENAI_MODEL,
    instructions: CHAT_PROMPT,
    input:
      "CONTEXT:\n" +
      chatContext(o, p, m, a, bidDocumentContext) +
      "\n\nUSER QUESTION:\n" +
      question,
    max_output_tokens: 800,
    store: false,
  });
  return (
    response.output_text ||
    "The available source information is insufficient to answer that question."
  );
}
