import { zodTextFormat } from "openai/helpers/zod";
import { chunkTenderText } from "../documents/extract.ts";
import { getOpenAIClient, OPENAI_MODEL } from "./client.ts";
import { DOCUMENT_REQUIREMENTS_PROMPT } from "./prompts.ts";
import {
  tenderRequirementExtractionSchema,
  type TenderRequirementExtraction,
} from "./schemas.ts";
const empty = (): TenderRequirementExtraction => ({
  requirements: [],
  documentsRequired: [],
  keyDates: [],
  certificationsMentioned: [],
  financialThresholds: [],
  insuranceRequirements: [],
  experienceRequirements: [],
  questionsToVerify: [],
});
const unique = (values: string[]) => [
  ...new Set(values.map((x) => x.trim()).filter(Boolean)),
];
export function mergeRequirementExtractions(
  parts: TenderRequirementExtraction[],
): TenderRequirementExtraction {
  const merged = empty(),
    seen = new Set<string>();
  for (const part of parts) {
    for (const r of part.requirements) {
      const key = (r.category + ":" + r.title + ":" + r.description)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 500);
      if (!seen.has(key)) {
        seen.add(key);
        merged.requirements.push(r);
      }
    }
    merged.documentsRequired.push(...part.documentsRequired);
    merged.keyDates.push(...part.keyDates);
    merged.certificationsMentioned.push(...part.certificationsMentioned);
    merged.financialThresholds.push(...part.financialThresholds);
    merged.insuranceRequirements.push(...part.insuranceRequirements);
    merged.experienceRequirements.push(...part.experienceRequirements);
    merged.questionsToVerify.push(...part.questionsToVerify);
    merged.submissionMethod ??= part.submissionMethod;
    merged.clarificationDeadline ??= part.clarificationDeadline;
  }
  merged.documentsRequired = unique(merged.documentsRequired);
  merged.certificationsMentioned = unique(merged.certificationsMentioned);
  merged.financialThresholds = unique(merged.financialThresholds);
  merged.insuranceRequirements = unique(merged.insuranceRequirements);
  merged.experienceRequirements = unique(merged.experienceRequirements);
  merged.questionsToVerify = unique(merged.questionsToVerify);
  return merged;
}
export async function extractTenderRequirements(
  documentName: string,
  text: string,
) {
  const chunks = chunkTenderText(text);
  if (!chunks.length) return empty();
  const client = getOpenAIClient(),
    parts: TenderRequirementExtraction[] = [];
  for (const [chunkIndex, chunk] of chunks.entries()) {
    const response = await client.responses.parse({
      model: OPENAI_MODEL,
      instructions: DOCUMENT_REQUIREMENTS_PROMPT,
      input: JSON.stringify({
        documentName,
        sourceReference: "Found in extracted text",
        chunkIndex: chunkIndex + 1,
        totalChunks: chunks.length,
        documentText: chunk,
      }),
      max_output_tokens: 4000,
      text: {
        format: zodTextFormat(
          tenderRequirementExtractionSchema,
          "tender_requirement_extraction",
        ),
      },
    });
    const parsed = tenderRequirementExtractionSchema.safeParse(
      response.output_parsed,
    );
    if (!parsed.success)
      throw new Error(
        "Document requirement extraction could not be validated.",
      );
    parts.push(parsed.data);
  }
  return mergeRequirementExtractions(parts);
}
