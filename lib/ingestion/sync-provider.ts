import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { providerRegistry } from "@/lib/opportunities/providers/registry";
import { searchSamOpportunitiesWith } from "@/lib/opportunities/providers/sam";
import { providerMaxRequests, samSyncEnabled, samSyncLookbackDays } from "./config";
import { updateSyncState, upsertOpportunities } from "./upsert";
import type { SyncProviderOptions, SyncResult } from "./types";

export function createIngestionClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(), key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("Supabase service role is not configured for ingestion.");
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function syncProvider(options: SyncProviderOptions, client: SupabaseClient<Database> = createIngestionClient()): Promise<SyncResult> {
  const started = Date.now(), now = new Date(), source = options.source;
  if (source === "SAM" && !samSyncEnabled()) return { source, status: "disabled", recordsFetched: 0, recordsInserted: 0, recordsUpdated: 0, requests: 0, durationMs: 0, safeError: "SAM synchronization is disabled." };
  const maxRequests = options.maxRequests ?? providerMaxRequests(source);
  let recordsFetched = 0, recordsInserted = 0, recordsUpdated = 0, requests = 0;
  await updateSyncState(client, source, { last_attempt_at: now.toISOString() });
  try {
    for (let page = 1; page <= maxRequests; page += 1) {
      requests += 1;
      const result = source === "SAM" && !options.provider
        ? await searchSamOpportunitiesWith({ page, limit: 100 }, { apiKey: process.env.SAM_API_KEY, lookbackDays: samSyncLookbackDays() })
        : await (options.provider ?? providerRegistry[source]).search({ page, limit: 100 });
      const rateLimited = result.diagnostic?.upstreamStatus === 429 || result.diagnostic?.errorType === "rate_limited";
      if (rateLimited) {
        await updateSyncState(client, source, { last_error_type: "rate_limited", last_safe_error: "Provider rate limit reached.", records_fetched: recordsFetched, records_inserted: recordsInserted, records_updated: recordsUpdated, is_stale: true });
        return { source, status: "rate_limited", recordsFetched, recordsInserted, recordsUpdated, requests, durationMs: Date.now() - started, diagnostic: result.diagnostic, safeError: "Provider rate limit reached." };
      }
      if (result.error && !result.items.length) throw Object.assign(new Error(result.error), { diagnostic: result.diagnostic });
      recordsFetched += result.items.length;
      const counts = await upsertOpportunities(client, result.items, now);
      recordsInserted += counts.inserted; recordsUpdated += counts.updated;
      if (!result.items.length || result.items.length < 100) break;
    }
    await updateSyncState(client, source, { last_success_at: new Date().toISOString(), last_error_type: null, last_safe_error: null, records_fetched: recordsFetched, records_inserted: recordsInserted, records_updated: recordsUpdated, is_stale: false });
    return { source, status: "success", recordsFetched, recordsInserted, recordsUpdated, requests, durationMs: Date.now() - started };
  } catch (error) {
    const diagnostic = error && typeof error === "object" && "diagnostic" in error ? error.diagnostic as SyncResult["diagnostic"] : undefined;
    const safeError = error instanceof Error ? error.message : "Provider synchronization failed.";
    await updateSyncState(client, source, { last_error_type: diagnostic?.errorType ?? "sync_failed", last_safe_error: safeError, records_fetched: recordsFetched, records_inserted: recordsInserted, records_updated: recordsUpdated, is_stale: true });
    return { source, status: "failed", recordsFetched, recordsInserted, recordsUpdated, requests, durationMs: Date.now() - started, diagnostic, safeError };
  }
}
