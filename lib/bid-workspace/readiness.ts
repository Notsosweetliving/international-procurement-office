import type { ComplianceLike } from "./types.ts";
export interface ReadinessInput {
  items: ComplianceLike[];
  submissionCompleted: number;
  submissionTotal: number;
  daysRemaining: number | null;
}
const met = new Set(["meets", "likely_meets", "not_applicable"]),
  addressed = new Set([...met, "needs_evidence"]);
const ratio = (a: number, b: number) =>
  b ? Math.min(1, Math.max(0, a / b)) : 1;
export function calculateBidReadiness(input: ReadinessInput) {
  const mandatory = input.items.filter(
      (x) =>
        x.requirement.mandatoryStatus === "mandatory" ||
        x.requirement.mandatoryStatus === "appears_mandatory",
    ),
    certs = input.items.filter(
      (x) => x.requirement.requirementType === "certification",
    ),
    financial = input.items.filter((x) =>
      ["financial", "commercial"].includes(x.requirement.requirementType),
    );
  const mandatoryScore =
      ratio(
        mandatory.filter((x) => met.has(x.status)).length,
        mandatory.length,
      ) * 35,
    evidenceScore =
      ratio(
        input.items.filter(
          (x) => x.evidenceAvailable || x.status === "not_applicable",
        ).length,
        input.items.length,
      ) * 20,
    certScore =
      ratio(
        certs.filter((x) => met.has(x.status) || x.evidenceAvailable).length,
        certs.length,
      ) * 15,
    submissionScore =
      ratio(input.submissionCompleted, input.submissionTotal) * 10,
    financialScore =
      ratio(
        financial.filter((x) => met.has(x.status) || x.evidenceAvailable)
          .length,
        financial.length,
      ) * 10,
    deadlineFactor =
      input.daysRemaining === null
        ? 0.5
        : input.daysRemaining < 0
          ? 0
          : input.daysRemaining <= 3
            ? 0.2
            : input.daysRemaining <= 7
              ? 0.5
              : input.daysRemaining <= 14
                ? 0.75
                : 1,
    deadlineScore = deadlineFactor * 10;
  const score = Math.min(
      100,
      Math.max(
        0,
        Math.round(
          mandatoryScore +
            evidenceScore +
            certScore +
            submissionScore +
            financialScore +
            deadlineScore,
        ),
      ),
    ),
    addressedCount = input.items.filter((x) => addressed.has(x.status)).length,
    blockers = input.items.filter(
      (x) =>
        (x.requirement.mandatoryStatus === "mandatory" ||
          x.requirement.mandatoryStatus === "appears_mandatory") &&
        ["missing", "needs_review"].includes(x.status),
    );
  return {
    score,
    addressedCount,
    totalRequirements: input.items.length,
    blockers,
    breakdown: {
      mandatory: Math.round(mandatoryScore),
      evidence: Math.round(evidenceScore),
      certifications: Math.round(certScore),
      submission: Math.round(submissionScore),
      financial: Math.round(financialScore),
      deadline: Math.round(deadlineScore),
    },
  };
}
