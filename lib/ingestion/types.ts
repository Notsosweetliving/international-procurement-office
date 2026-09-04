import type { OpportunityProvider, ProviderDiagnostic } from "@/lib/opportunities/providers/types";
import type { OpportunitySource } from "@/lib/opportunities/types";

export type IngestionSource = Exclude<OpportunitySource, "mock" | "NATO">;
export interface SyncResult {
  source: IngestionSource;
  status: "success" | "failed" | "rate_limited" | "disabled";
  recordsFetched: number;
  recordsInserted: number;
  recordsUpdated: number;
  requests: number;
  durationMs: number;
  diagnostic?: ProviderDiagnostic;
  safeError?: string;
}
export interface SyncProviderOptions {
  source: IngestionSource;
  provider?: OpportunityProvider;
  maxRequests?: number;
}
