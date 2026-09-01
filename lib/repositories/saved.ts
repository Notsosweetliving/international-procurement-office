import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/database.types.ts";
import type { Opportunity } from "../opportunities/types.ts";
export function savedOpportunityInsert(userId: string, o: Opportunity) {
  return {
    user_id: userId,
    source: o.source ?? "TED",
    source_opportunity_id: o.id,
    opportunity_title: o.title.slice(0, 1000),
    buyer_name: o.buyer.name.slice(0, 500) || null,
    source_url: o.sourceUrl ?? null,
  };
}
export async function isSaved(
  db: SupabaseClient<Database>,
  userId: string,
  opportunityId: string,
) {
  const { data, error } = await db
    .from("saved_opportunities")
    .select("id")
    .eq("user_id", userId)
    .eq("source_opportunity_id", opportunityId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}
export async function saveOpportunity(
  db: SupabaseClient<Database>,
  userId: string,
  o: Opportunity,
) {
  const { error } = await db
    .from("saved_opportunities")
    .upsert(savedOpportunityInsert(userId, o), {
      onConflict: "user_id,source,source_opportunity_id",
    });
  if (error) throw error;
}
export async function unsaveOpportunity(
  db: SupabaseClient<Database>,
  userId: string,
  opportunityId: string,
) {
  const { error } = await db
    .from("saved_opportunities")
    .delete()
    .eq("user_id", userId)
    .eq("source_opportunity_id", opportunityId);
  if (error) throw error;
}
export async function listSaved(db: SupabaseClient<Database>, userId: string) {
  const { data, error } = await db
    .from("saved_opportunities")
    .select("*")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });
  if (error) throw error;
  return data;
}
