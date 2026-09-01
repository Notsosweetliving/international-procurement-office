export type MatchBand = "strong" | "good" | "possible" | "weak";
export type MatchConfidence =
  "High confidence" | "Medium confidence" | "Low confidence";
export interface ScoreBreakdown {
  capability: number;
  geography: number;
  value: number;
  businessModel: number;
  certifications: number;
  governmentExperience: number;
  dataCompleteness: number;
  deadline: number;
}
export interface CalculatedMatch {
  score: number;
  band: MatchBand;
  label: string;
  confidence: MatchConfidence;
  eligibility: "appears-compatible" | "review";
  positiveReasons: string[];
  warnings: string[];
  failedRequirements: string[];
  scoreBreakdown: ScoreBreakdown;
}
