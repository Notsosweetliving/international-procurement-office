export type RequirementType =
  | "eligibility"
  | "technical"
  | "financial"
  | "commercial"
  | "certification"
  | "experience"
  | "submission"
  | "delivery"
  | "legal"
  | "other";
export type MandatoryStatus =
  "mandatory" | "appears_mandatory" | "optional" | "unclear";
export type ComplianceStatus =
  | "meets"
  | "likely_meets"
  | "needs_evidence"
  | "missing"
  | "needs_review"
  | "not_applicable";
export type BidDecision = "undecided" | "pursue" | "review" | "do_not_bid";
export interface RequirementLike {
  id?: string;
  title: string;
  description: string;
  requirementType: RequirementType;
  mandatoryStatus: MandatoryStatus;
  confidence: "high" | "medium" | "low";
  sourceDocument?: string;
  sourceReference?: string;
}
export interface ComplianceLike {
  requirement: RequirementLike;
  status: ComplianceStatus;
  evidenceAvailable: boolean;
  checklistComplete?: boolean;
}
