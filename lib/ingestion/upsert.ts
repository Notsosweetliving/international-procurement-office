import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { opportunityToCacheRow } from "@/lib/opportunities/cache";
import type { Opportunity } from "@/lib/opportunities/types";

export async function upsertOpportunities(client: SupabaseClient<Database>, opportunities: Opportunity[], now = new Date()) {
  if (!opportunities.length) return { inserted: 0, updated: 0 };
  const source = opportunities[0].source;
  const ids = opportunities.map((x) => x.id);
  const { data: existing, error: lookupError } = await client.from("procurement_opportunities").select("source_opportunity_id").eq("source", source ?? "TED").in("source_opportunity_id", ids);
  if (lookupError) throw lookupError;
  const existingIds = new Set((existing ?? []).map((x) => x.source_opportunity_id));
  const unique = [...new Map(opportunities.map((x) => [`${x.source}:${x.id}`, x])).values()];
  const rows = unique.map((x) => opportunityToCacheRow(x, now));
  const { error } = await client.from("procurement_opportunities").upsert(rows, { onConflict: "source,source_opportunity_id" });
  if (error) throw error;
  return { inserted: unique.filter((x) => !existingIds.has(x.id)).length, updated: unique.filter((x) => existingIds.has(x.id)).length };
}

export async function updateSyncState(client: SupabaseClient<Database>, source: string, values: Partial<Database["public"]["Tables"]["procurement_source_sync_state"]["Row"]>) {
  const { error } = await client.from("procurement_source_sync_state").upsert({ source, ...values, updated_at: new Date().toISOString() }, { onConflict: "source" });
  if (error) throw error;
}
