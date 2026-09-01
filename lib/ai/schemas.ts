import { z } from "zod";
const confidence = z.enum(["confirmed", "likely", "unclear"]);
export const tenderAnalysisSchema = z.object({
  conciseTitle: z.string().max(120).optional(),
  summary: z.string().min(1).max(2000),
  procurementType: z.string().max(200).optional(),
  sourceSufficiency: z.enum(["sufficient", "limited"]),
  keyRequirements: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        confidence,
        sourceBasis: z.string().optional(),
      }),
    )
    .max(20),
  importantDates: z
    .array(
      z.object({
        label: z.string(),
        date: z.string().optional(),
        description: z.string().optional(),
        confidence: z.enum(["confirmed", "unclear"]),
      }),
    )
    .max(15),
  certifications: z
    .array(
      z.object({
        name: z.string(),
        status: z.enum(["mentioned", "appears_required", "unclear"]),
        context: z.string().optional(),
      }),
    )
    .max(15),
  financialRequirements: z.array(z.string()).max(15),
  technicalRequirements: z.array(z.string()).max(20),
  submissionRequirements: z.array(z.string()).max(20),
  eligibilitySignals: z
    .array(
      z.object({
        description: z.string(),
        status: z.enum(["confirmed", "review"]),
      }),
    )
    .max(15),
  risks: z
    .array(
      z.object({
        severity: z.enum(["low", "medium", "high"]),
        title: z.string(),
        explanation: z.string(),
      }),
    )
    .max(15),
  questionsToVerify: z.array(z.string()).max(20),
  recommendedNextSteps: z.array(z.string()).max(15),
});
export type TenderAnalysis = z.infer<typeof tenderAnalysisSchema>;
export const searchIntentSchema = z.object({
  keywords: z.array(z.string()).max(8).optional(),
  categories: z.array(z.string()).max(8).optional(),
  countries: z.array(z.string()).max(8).optional(),
  sources: z
    .array(z.enum(["TED", "NATO", "UK", "SAM"]))
    .max(4)
    .optional(),
  minValue: z.number().nonnegative().optional(),
  maxValue: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  closingWithinDays: z.number().int().min(1).max(365).optional(),
  minimumMatchScore: z.number().min(0).max(100).optional(),
  sort: z
    .enum(["best_match", "closing_soon", "newest", "highest_value"])
    .optional(),
});
export type ProcurementSearchIntent = z.infer<typeof searchIntentSchema>;
export const analysisRequestSchema = z.object({
  opportunityId: z.string().min(1).max(160),
});
export const chatRequestSchema = z.object({
  opportunityId: z.string().min(1).max(160),
  question: z.string().min(2).max(500),
  companyProfile: z.unknown().optional(),
  analysis: tenderAnalysisSchema.optional(),
});
export const searchRequestSchema = z.object({
  query: z.string().min(2).max(500),
  companyProfile: z.unknown().optional(),
});
const documentRequirementSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().min(1).max(2000),
  category: z.enum([
    "eligibility",
    "technical",
    "financial",
    "commercial",
    "certification",
    "experience",
    "submission",
    "delivery",
    "legal",
    "other",
  ]),
  mandatoryStatus: z.enum([
    "mandatory",
    "appears_mandatory",
    "optional",
    "unclear",
  ]),
  confidence: z.enum(["high", "medium", "low"]),
  sourceDocument: z.string().min(1).max(255),
  sourceReference: z.string().min(1).max(500),
});
export const tenderRequirementExtractionSchema = z.object({
  requirements: z.array(documentRequirementSchema).max(80),
  documentsRequired: z.array(z.string().max(500)).max(40),
  keyDates: z
    .array(
      z.object({
        label: z.string(),
        date: z.string().optional(),
        sourceReference: z.string(),
      }),
    )
    .max(30),
  certificationsMentioned: z.array(z.string()).max(30),
  financialThresholds: z.array(z.string()).max(30),
  insuranceRequirements: z.array(z.string()).max(30),
  experienceRequirements: z.array(z.string()).max(30),
  submissionMethod: z.string().max(1000).optional(),
  clarificationDeadline: z.string().max(200).optional(),
  questionsToVerify: z.array(z.string()).max(40),
});
export type TenderRequirementExtraction = z.infer<
  typeof tenderRequirementExtractionSchema
>;
