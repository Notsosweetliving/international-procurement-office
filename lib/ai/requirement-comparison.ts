import type { CompanyProfile } from "../opportunities/types";
import type { TenderAnalysis } from "./schemas";
export interface RequirementReview {
  matches: string[];
  review: string[];
  unknown: string[];
}
export function compareRequirements(
  profile: CompanyProfile | null,
  analysis: TenderAnalysis,
): RequirementReview {
  if (!profile)
    return {
      matches: [],
      review: ["Add a company profile to compare extracted requirements."],
      unknown: analysis.questionsToVerify,
    };
  const matches: string[] = [],
    review: string[] = [],
    unknown = [...analysis.questionsToVerify];
  for (const c of analysis.certifications) {
    const has = profile.certifications.some(
      (x) =>
        x.toLowerCase().includes(c.name.toLowerCase()) ||
        c.name.toLowerCase().includes(x.toLowerCase()),
    );
    (has ? matches : review).push(
      has
        ? c.name + " is referenced and listed on your profile"
        : c.name + " is referenced but not listed on your profile",
    );
  }
  const corpus = [
    ...analysis.technicalRequirements,
    ...analysis.keyRequirements.map((x) => x.description),
  ]
    .join(" ")
    .toLowerCase();
  for (const cap of profile.capabilities)
    if (corpus.includes(cap.toLowerCase()))
      matches.push(cap + " capability appears aligned");
  return {
    matches: [...new Set(matches)],
    review: [...new Set(review)],
    unknown: [...new Set(unknown)],
  };
}
