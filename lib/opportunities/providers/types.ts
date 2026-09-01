import type { Opportunity, OpportunitySource } from "../types";
export interface OpportunitySearchParams {
  query?: string;
  sources?: OpportunitySource[];
  countries?: string[];
  categories?: string[];
  page?: number;
  limit?: number;
}
export interface ProviderHealth {
  source: OpportunitySource;
  status: "ok" | "unavailable" | "partial";
  resultCount: number;
  message?: string;
}
export interface OpportunitySearchResult {
  items: Opportunity[];
  total: number;
  error?: string;
  health?: ProviderHealth[];
}
export interface OpportunityProvider {
  source: OpportunitySource;
  search(params?: OpportunitySearchParams): Promise<OpportunitySearchResult>;
  getById(id: string): Promise<Opportunity | null>;
}
export interface TedSearchResponse {
  notices?: unknown;
  totalNoticeCount?: unknown;
  timedOut?: unknown;
}
