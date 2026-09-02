import type { Opportunity, OpportunitySource } from "./types.ts";
import type {
  OpportunitySearchResult,
  ProviderHealth,
} from "./providers/types.ts";
export function combineProviderSettlements(
  sources: Exclude<OpportunitySource, "mock">[],
  settled: PromiseSettledResult<OpportunitySearchResult>[],
) {
  const items: Opportunity[] = [],
    health: ProviderHealth[] = [];
  settled.forEach((entry, index) => {
    const source = sources[index];
    if (entry.status === "rejected") {
      health.push({
        source,
        status: "unavailable",
        resultCount: 0,
        message: `${source} source is temporarily unavailable.`,
      });
      return;
    }
    const result = entry.value;
    items.push(...result.items);
    health.push({
      source,
      status: result.error
        ? result.items.length
          ? "partial"
          : "unavailable"
        : "ok",
      resultCount: result.items.length,
      message: result.error,
      diagnostic: result.diagnostic,
    });
  });
  return { items, health };
}
