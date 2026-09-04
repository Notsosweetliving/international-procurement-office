import type { Opportunity, OpportunitySource } from "../types";
export interface OpportunitySearchParams {
  query?: string;
  sources?: OpportunitySource[];
  countries?: string[];
  categories?: string[];
  page?: number;
  limit?: number;
  minValue?: number;
  maxValue?: number;
  currency?: string;
  deadlineBefore?: string;
  closingWithinDays?: number;
  sort?: "newest" | "deadline" | "value_desc";
}
export interface ProviderHealth {
  source: OpportunitySource;
  status: "ok" | "unavailable" | "partial";
  resultCount: number;
  message?: string;
  diagnostic?: ProviderDiagnostic;
}
export interface ProviderDiagnostic {
  provider: Exclude<OpportunitySource, "mock">;
  configured: boolean;
  status: "ok" | "failed";
  upstreamStatus?: number;
  rawCount: number;
  normalizedCount: number;
  resultCount: number;
  durationMs: number;
  errorType?: string;
  safeErrorMessage?: string;
  upstreamUrl: string;
  timeout: boolean;
  checkedAt: string;
  errorName?: string;
  errorCode?: string;
  causeName?: string;
  causeCode?: string;
  causeMessage?: string;
}
export interface OpportunitySearchResult {
  items: Opportunity[];
  total: number;
  error?: string;
  health?: ProviderHealth[];
  diagnostic?: ProviderDiagnostic;
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
