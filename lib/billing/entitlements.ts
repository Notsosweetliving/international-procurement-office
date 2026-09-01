import { PLANS, type Meter, type PlanId } from "./plans.ts";
export function entitlement(plan: PlanId, meter: Meter, used: number) {
  const limit = PLANS[plan].limits[meter];
  return {
    allowed: used < limit,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}
export const canAnalyzeOpportunity = (p: PlanId, n: number) =>
  entitlement(p, "ai_analysis", n);
export const canAskContractOS = (p: PlanId, n: number) =>
  entitlement(p, "ai_question", n);
export const canCreateWorkspace = (p: PlanId, n: number) =>
  entitlement(p, "active_workspace", n);
export const canAddSupplier = (p: PlanId, n: number) =>
  entitlement(p, "supplier", n);
export const canSaveOpportunity = (p: PlanId, n: number) =>
  entitlement(p, "saved_opportunity", n);
export const canSaveSearch = (p: PlanId, n: number) =>
  entitlement(p, "saved_search", n);
