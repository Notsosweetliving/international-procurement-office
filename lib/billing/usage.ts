import type { PlanId, Meter } from "./plans.ts";
import { entitlement } from "./entitlements.ts";
export interface UsageStore {
  count(userId: string, meter: Meter, from: Date): Promise<number>;
  record(userId: string, event: string, quantity?: number): Promise<void>;
}
export async function checkUsage(
  store: UsageStore,
  userId: string,
  plan: PlanId,
  meter: Meter,
  now = new Date(),
) {
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return entitlement(plan, meter, await store.count(userId, meter, from));
}
