/* eslint-disable prefer-const -- paired destructuring preserves provider health beside the mutable merged list */
import { MOCK_COMPANY, MOCK_OPPORTUNITIES } from "./mock-data";
import { providerForId, providerRegistry } from "./providers/registry";
import { mergeConservative, sortOpportunities } from "./merge";
import { combineProviderSettlements } from "./settle";
import { configuredDefaultSources, selectOpportunitySources } from "./normalize/common";
import type {
  OpportunitySearchParams,
  OpportunitySearchResult,
} from "./providers/types";
import type { CompanyProfile, Opportunity, OpportunitySource } from "./types";
export interface OpportunityService {
  search(params?: OpportunitySearchParams): Promise<OpportunitySearchResult>;
  list(): Promise<Opportunity[]>;
  getById(id: string): Promise<Opportunity | null>;
  saved(): Promise<Opportunity[]>;
  company(): Promise<CompanyProfile>;
}
export const mockOpportunityService: OpportunityService = {
  async search() {
    return { items: MOCK_OPPORTUNITIES, total: MOCK_OPPORTUNITIES.length };
  },
  async list() {
    return MOCK_OPPORTUNITIES;
  },
  async getById(id) {
    return MOCK_OPPORTUNITIES.find((x) => x.id === id) ?? null;
  },
  async saved() {
    return MOCK_OPPORTUNITIES.filter((x) => x.saved);
  },
  async company() {
    return MOCK_COMPANY;
  },
};
export const realSources = (sources?: OpportunitySource[]) =>
  sources?.length ? selectOpportunitySources(sources) : configuredDefaultSources();
export async function searchOpportunities(
  params: OpportunitySearchParams = {},
): Promise<OpportunitySearchResult> {
  const sources = realSources(params.sources);
  const perProvider = Math.min(30, Math.max(1, params.limit ?? 20));
  const settled = await Promise.allSettled(
    sources.map((source) =>
      providerRegistry[source].search({ ...params, limit: perProvider }),
    ),
  );
  let { items, health } = combineProviderSettlements(sources, settled);
  items = mergeConservative(items);
  if (params.countries?.length)
    items = items.filter((o) =>
      params.countries!.some((country) =>
        o.country.toLowerCase().includes(country.toLowerCase()),
      ),
    );
  if (params.categories?.length)
    items = items.filter((o) => params.categories!.includes(o.category));
  items = sortOpportunities(items, "newest");
  const allUnavailable = health.every((x) => x.status === "unavailable");
  return {
    items: items.slice(
      0,
      Math.min(50, (params.limit ?? 20) * Math.max(1, sources.length)),
    ),
    total: items.length,
    health,
    error: allUnavailable
      ? health.length === 1
        ? health[0].message
        : "All selected procurement sources are unavailable."
      : undefined,
  };
}
export const opportunityService: OpportunityService = {
  search: searchOpportunities,
  async list() {
    return (await searchOpportunities()).items;
  },
  async getById(id) {
    return providerForId(id)?.getById(id) ?? mockOpportunityService.getById(id);
  },
  async saved() {
    return mockOpportunityService.saved();
  },
  async company() {
    return MOCK_COMPANY;
  },
};
