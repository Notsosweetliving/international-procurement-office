import type { FulfilmentAssignment } from "./types.ts";
const ratio = (a: number, b: number) =>
  b ? Math.min(1, Math.max(0, a / b)) : 1;
export function calculateFulfilmentReadiness(
  assignments: FulfilmentAssignment[],
) {
  const critical = assignments.filter((x) => x.need.critical),
    assigned = critical.filter((x) => x.supplier),
    fitValues = assignments
      .filter((x) => x.supplierFit !== null)
      .map((x) => x.supplierFit!),
    quotes = assignments.filter(
      (x) => x.quoteStatus === "received" && x.quotedAmount !== null,
    ),
    leads = assignments.filter((x) => x.leadTimeDays !== null),
    evidence = assignments.filter((x) => x.evidenceComplete),
    logistics = assignments.filter((x) => x.logisticsCovered);
  const breakdown = {
    criticalAssigned: Math.round(ratio(assigned.length, critical.length) * 35),
    supplierFit: Math.round(
      (fitValues.length
        ? fitValues.reduce((a, b) => a + b, 0) / fitValues.length / 100
        : 0) * 20,
    ),
    quotes: Math.round(ratio(quotes.length, assignments.length) * 15),
    leadTimes: Math.round(ratio(leads.length, assignments.length) * 15),
    evidence: Math.round(ratio(evidence.length, assignments.length) * 10),
    logistics: Math.round(ratio(logistics.length, assignments.length) * 5),
  };
  const score = Math.min(
    100,
    Math.max(
      0,
      Object.values(breakdown).reduce((a, b) => a + b, 0),
    ),
  );
  return {
    score,
    covered: assignments.filter((x) => x.supplier).length,
    total: assignments.length,
    gaps: assignments.filter((x) => !x.supplier),
    breakdown,
  };
}
export function calculateCostPlan(
  contractValue: number | null,
  costs: {
    quotedAmount: number | null;
    logisticsCost: number | null;
    otherCost: number | null;
  }[],
) {
  const entered = costs
    .flatMap((x) => [x.quotedAmount, x.logisticsCost, x.otherCost])
    .filter((x): x is number => x !== null);
  if (contractValue === null || !entered.length)
    return {
      complete: false,
      totalEnteredCosts: entered.reduce((a, b) => a + b, 0),
      remainingSpread: null,
    };
  const totalEnteredCosts = entered.reduce((a, b) => a + b, 0);
  return {
    complete: true,
    totalEnteredCosts,
    remainingSpread: contractValue - totalEnteredCosts,
  };
}
