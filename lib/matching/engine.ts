import type { CompanyProfile, Opportunity } from "../opportunities/types";
import type { CalculatedMatch, MatchBand, ScoreBreakdown } from "./types";
import { capabilitiesForOpportunity } from "./taxonomy.ts";
const EU = [
  "Austria",
  "Belgium",
  "Bulgaria",
  "Croatia",
  "Cyprus",
  "Czechia",
  "Denmark",
  "Estonia",
  "Finland",
  "France",
  "Germany",
  "Greece",
  "Hungary",
  "Ireland",
  "Italy",
  "Latvia",
  "Lithuania",
  "Luxembourg",
  "Malta",
  "Netherlands",
  "Poland",
  "Portugal",
  "Romania",
  "Slovakia",
  "Slovenia",
  "Spain",
  "Sweden",
];
const NATO = [
  "Albania",
  "Belgium",
  "Bulgaria",
  "Canada",
  "Croatia",
  "Czechia",
  "Denmark",
  "Estonia",
  "Finland",
  "France",
  "Germany",
  "Greece",
  "Hungary",
  "Iceland",
  "Italy",
  "Latvia",
  "Lithuania",
  "Luxembourg",
  "Montenegro",
  "Netherlands",
  "North Macedonia",
  "Norway",
  "Poland",
  "Portugal",
  "Romania",
  "Slovakia",
  "Slovenia",
  "Spain",
  "Sweden",
  "Türkiye",
  "United Kingdom",
  "United States",
];
export function geographyCompatibility(
  company: CompanyProfile,
  opportunity: Opportunity,
) {
  const worldwide = company.regions.includes("Worldwide");
  if (opportunity.source === "NATO")
    return {
      compatible:
        worldwide ||
        company.regions.includes("NATO") ||
        NATO.includes(company.country),
      warning:
        "NATO jurisdiction should be reviewed; membership alone does not establish eligibility.",
    };
  if (opportunity.source === "UK")
    return {
      compatible:
        worldwide ||
        company.regions.includes("United Kingdom") ||
        company.country === "United Kingdom",
      warning: "United Kingdom jurisdiction should be reviewed.",
    };
  if (opportunity.source === "SAM")
    return {
      compatible:
        worldwide ||
        company.regions.includes("United States") ||
        company.country === "United States",
      warning:
        "US Federal jurisdiction and notice-specific eligibility should be reviewed.",
    };
  return {
    compatible:
      worldwide ||
      company.regions.includes("European Union") ||
      EU.includes(company.country),
    warning: "European Union jurisdiction should be reviewed.",
  };
}
const clamp = (n: number) =>
  Math.max(0, Math.min(100, Math.round(Number.isFinite(n) ? n : 0)));
export const matchLabel = (score: number) =>
  score >= 90
    ? "Strong match"
    : score >= 75
      ? "Good match"
      : score >= 50
        ? "Possible match"
        : "Weak match";
const band = (s: number): MatchBand =>
  s >= 90 ? "strong" : s >= 75 ? "good" : s >= 50 ? "possible" : "weak";
export function calculateOpportunityMatch(
  company: CompanyProfile,
  opportunity: Opportunity,
  now = new Date(),
): CalculatedMatch {
  const positiveReasons: string[] = [],
    warnings: string[] = [
      "Legal eligibility has not been independently verified.",
    ],
    failedRequirements: string[] = [];
  const scoreBreakdown: ScoreBreakdown = {
    capability: 0,
    geography: 0,
    value: 0,
    businessModel: 0,
    certifications: 0,
    governmentExperience: 0,
    dataCompleteness: 0,
    deadline: 0,
  };
  const relevant = capabilitiesForOpportunity(
    opportunity.category,
    opportunity.cpvCodes,
    opportunity.naicsCodes,
  );
  const aligned = relevant.filter((x) => company.capabilities.includes(x));
  scoreBreakdown.capability = aligned.length ? 30 : relevant.length ? 3 : 12;
  if (aligned.length)
    positiveReasons.push(
      `${aligned[0]} capability aligns with the source classification`,
    );
  else if (relevant.length)
    warnings.push("No directly aligned capability is listed on your profile.");
  const geography = geographyCompatibility(company, opportunity);
  scoreBreakdown.geography = geography.compatible ? 20 : 6;
  if (geography.compatible)
    positiveReasons.push(
      "Geography appears compatible with your served regions",
    );
  else warnings.push(geography.warning);
  if (opportunity.value == null) {
    scoreBreakdown.value = 8;
    warnings.push("Opportunity value is not disclosed.");
  } else if (
    !company.preferredCurrency ||
    !opportunity.currency ||
    company.preferredCurrency !== opportunity.currency
  ) {
    scoreBreakdown.value = 7;
    warnings.push(
      "Value comparison unavailable because currencies differ or are unspecified.",
    );
  } else {
    const min = company.minContractValue,
      max = company.maxContractValue;
    if (opportunity.value >= min && opportunity.value <= max) {
      scoreBreakdown.value = 15;
      positiveReasons.push("Opportunity value is inside your target range");
    } else if (
      opportunity.value >= min * 0.5 &&
      opportunity.value <= max * 1.5
    ) {
      scoreBreakdown.value = 8;
      warnings.push(
        "Opportunity value is slightly outside your preferred range.",
      );
    } else {
      scoreBreakdown.value = 2;
      warnings.push("Opportunity value is far outside your preferred range.");
    }
  }
  const models = company.businessModels;
  const hardware = relevant.some((x) =>
    ["IT hardware", "Electronics", "Vehicle Parts"].includes(x),
  );
  const service = relevant.some((x) =>
    [
      "Software",
      "Cybersecurity",
      "Networking",
      "Professional Services",
    ].includes(x),
  );
  const modelFit =
    (hardware &&
      models.some((x) =>
        [
          "Manufacturer",
          "Distributor",
          "Reseller",
          "Systems Integrator",
        ].includes(x),
      )) ||
    (service &&
      models.some((x) =>
        ["Consultant", "Service Provider", "Systems Integrator"].includes(x),
      ));
  scoreBreakdown.businessModel = modelFit ? 10 : relevant.length ? 5 : 6;
  if (modelFit)
    positiveReasons.push(
      "Business model is compatible with this opportunity category",
    );
  const body = (opportunity.title + " " + opportunity.summary).toLowerCase();
  const mentioned = ["ISO 9001", "ISO 27001", "Cyber Essentials"].filter((c) =>
    body.includes(c.toLowerCase()),
  );
  const missing = mentioned.filter(
    (c) =>
      !company.certifications.some((x) =>
        x.toLowerCase().includes(c.toLowerCase()),
      ),
  );
  scoreBreakdown.certifications = mentioned.length
    ? missing.length
      ? 3
      : 10
    : 6;
  if (mentioned.length && !missing.length)
    positiveReasons.push(
      "Your profile lists certifications referenced in the notice",
    );
  missing.forEach((c) =>
    warnings.push(
      `${c} is referenced in the notice and is not listed on your profile.`,
    ),
  );
  scoreBreakdown.governmentExperience =
    company.governmentExperience === "Experienced government contractor"
      ? 5
      : company.governmentExperience === "Some government experience"
        ? 3
        : 1;
  if (scoreBreakdown.governmentExperience >= 3)
    positiveReasons.push("Government contracting experience is listed");
  const structured = [
    opportunity.cpvCodes?.length,
    opportunity.value != null,
    !!opportunity.deadline,
    opportunity.country !== "Not disclosed",
    !!opportunity.buyer.name,
  ].filter(Boolean).length;
  scoreBreakdown.dataCompleteness = Math.min(5, structured);
  if (!opportunity.deadline) scoreBreakdown.deadline = 3;
  else {
    const days = Math.ceil(
      (new Date(opportunity.deadline).getTime() - now.getTime()) / 86400000,
    );
    if (!Number.isFinite(days)) scoreBreakdown.deadline = 3;
    else if (days < 0) {
      scoreBreakdown.deadline = 0;
      warnings.push("This opportunity is closed.");
      failedRequirements.push("Deadline has passed");
    } else if (days < 7) {
      scoreBreakdown.deadline = 1;
      warnings.push("Fewer than 7 days remain before the deadline.");
    } else if (days < 14) {
      scoreBreakdown.deadline = 2;
      warnings.push("The submission window is short.");
    } else if (days <= 30) scoreBreakdown.deadline = 4;
    else scoreBreakdown.deadline = 5;
  }
  const score = clamp(Object.values(scoreBreakdown).reduce((a, b) => a + b, 0));
  const confidence =
    structured >= 4
      ? "High confidence"
      : structured >= 2
        ? "Medium confidence"
        : "Low confidence";
  return {
    score,
    band: band(score),
    label: matchLabel(score),
    confidence,
    eligibility: geography.compatible ? "appears-compatible" : "review",
    positiveReasons,
    warnings,
    failedRequirements,
    scoreBreakdown,
  };
}
