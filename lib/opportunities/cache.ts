import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import type { OpportunitySearchParams, OpportunitySearchResult } from "./providers/types";
import type { Opportunity, OpportunitySource } from "./types";

export type CacheRow = Database["public"]["Tables"]["procurement_opportunities"]["Row"];
export type SyncState = Database["public"]["Tables"]["procurement_source_sync_state"]["Row"];

export function opportunityToCacheRow(opportunity: Opportunity, now = new Date()) {
  const seen = now.toISOString();
  const codes = { cpv: opportunity.cpvCodes ?? [], naics: opportunity.naicsCodes ?? [], psc: opportunity.pscCodes ?? [] };
  return {
    source: opportunity.source ?? "TED",
    source_opportunity_id: opportunity.id,
    title: opportunity.title,
    description: opportunity.summary || null,
    buyer_name: opportunity.buyer.name || null,
    buyer_country: opportunity.buyer.country || null,
    procurement_country: opportunity.country || null,
    category: opportunity.category || null,
    classification_codes: codes as Json,
    estimated_value_min: opportunity.value,
    estimated_value_max: opportunity.value,
    currency: opportunity.currency,
    published_at: opportunity.publishedAt,
    deadline_at: opportunity.deadline,
    procedure_type: opportunity.procedureType ?? null,
    source_url: opportunity.sourceUrl ?? null,
    source_metadata: { reference: opportunity.reference, eligibility: opportunity.eligibility, buyerType: opportunity.buyer.type, buyerId: opportunity.buyer.id, descriptionUrl: opportunity.descriptionUrl ?? null, sourceOrganization: opportunity.sourceOrganization ?? null } as Json,
    source_updated_at: opportunity.publishedAt,
    last_seen_at: seen,
    updated_at: seen,
    is_active: !opportunity.deadline || new Date(opportunity.deadline).getTime() >= now.getTime(),
  };
}

const object = (value: Json | null) => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, Json | undefined> : {};
const strings = (value: Json | undefined) => Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : [];
export function cacheRowToOpportunity(row: CacheRow): Opportunity {
  const metadata = object(row.source_metadata), codes = object(row.classification_codes);
  return {
    id: row.source_opportunity_id,
    reference: typeof metadata.reference === "string" ? metadata.reference : row.source_opportunity_id,
    title: row.title,
    buyer: { id: typeof metadata.buyerId === "string" ? metadata.buyerId : row.buyer_name ?? "unknown", name: row.buyer_name ?? "Buyer not disclosed", type: typeof metadata.buyerType === "string" ? metadata.buyerType : "Public authority", country: row.buyer_country ?? row.procurement_country ?? "Unknown" },
    country: row.procurement_country ?? row.buyer_country ?? "Unknown",
    category: row.category ?? "Other",
    value: row.estimated_value_max ?? row.estimated_value_min,
    currency: row.currency,
    publishedAt: row.published_at,
    deadline: row.deadline_at,
    eligibility: typeof metadata.eligibility === "string" ? metadata.eligibility : "See official notice",
    summary: row.description ?? "No description supplied.",
    match: null, requirements: [], documents: [], source: row.source as OpportunitySource,
    sourceUrl: row.source_url ?? undefined,
    descriptionUrl: typeof metadata.descriptionUrl === "string" ? metadata.descriptionUrl : undefined,
    sourceOrganization: typeof metadata.sourceOrganization === "string" ? metadata.sourceOrganization : undefined,
    procedureType: row.procedure_type ?? undefined,
    cpvCodes: strings(codes.cpv), naicsCodes: strings(codes.naics), pscCodes: strings(codes.psc),
  };
}

export async function searchCachedOpportunities(client: SupabaseClient<Database>, params: OpportunitySearchParams = {}): Promise<OpportunitySearchResult> {
  const limit = Math.min(200, Math.max(1, params.limit ?? 20));
  let query = client.from("procurement_opportunities").select("*", { count: "exact" }).eq("is_active", true);
  if (params.query?.trim()) query = query.textSearch("search_vector", params.query.trim(), { config: "english", type: "websearch" });
  if (params.sources?.length) query = query.in("source", params.sources.filter((x) => x !== "mock"));
  if (params.countries?.length) query = query.in("procurement_country", params.countries);
  if (params.categories?.length) query = query.in("category", params.categories);
  if (params.minValue != null) query = query.gte("estimated_value_max", params.minValue);
  if (params.maxValue != null) query = query.lte("estimated_value_min", params.maxValue);
  if (params.currency) query = query.eq("currency", params.currency.toUpperCase());
  const deadlineBefore = params.deadlineBefore ?? (params.closingWithinDays ? new Date(Date.now() + params.closingWithinDays * 86400000).toISOString() : undefined);
  if (deadlineBefore) query = query.lte("deadline_at", deadlineBefore);
  query = params.sort === "deadline" ? query.order("deadline_at", { ascending: true, nullsFirst: false }) : params.sort === "value_desc" ? query.order("estimated_value_max", { ascending: false, nullsFirst: false }) : query.order("published_at", { ascending: false, nullsFirst: false });
  const { data, error, count } = await query.range((Math.max(1, params.page ?? 1) - 1) * limit, Math.max(1, params.page ?? 1) * limit - 1);
  if (error) throw error;
  const items = (data ?? []).map(cacheRowToOpportunity);
  return { items, total: count ?? items.length };
}

export async function getCachedOpportunity(client: SupabaseClient<Database>, id: string) {
  const { data, error } = await client.from("procurement_opportunities").select("*").eq("source_opportunity_id", id).maybeSingle();
  if (error) throw error;
  return data ? cacheRowToOpportunity(data) : null;
}

export async function listSyncStates(client: SupabaseClient<Database>) {
  const { data, error } = await client.from("procurement_source_sync_state").select("*").order("source");
  if (error) throw error;
  return data ?? [];
}

export function freshnessLabel(states: SyncState[], source?: OpportunitySource) {
  const relevant = source ? states.filter((x) => x.source === source) : states.filter((x) => ["TED", "UK", "SAM"].includes(x.source));
  const latest = relevant.map((x) => x.last_success_at).filter(Boolean).sort().at(-1);
  if (!latest) return "Procurement data awaiting first refresh";
  const hours = Math.max(0, Math.floor((Date.now() - new Date(latest).getTime()) / 3600000));
  return hours < 1 ? "Updated less than an hour ago" : hours < 24 ? `Updated ${hours} hour${hours === 1 ? "" : "s"} ago` : `Updated ${Math.floor(hours / 24)} day${Math.floor(hours / 24) === 1 ? "" : "s"} ago`;
}
