import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "../supabase/database.types.ts";
import { tenderAnalysisSchema, type TenderAnalysis } from "../ai/schemas.ts";
export function analysisIsFresh(stored: string | null, current: string | null) {
  return (stored ?? null) === (current ?? null);
}
export async function getPersistedAnalysis(
  db: SupabaseClient<Database>,
  userId: string,
  source: string | undefined,
  opportunityId: string,
  sourceUpdatedAt: string | null,
) {
  const { data, error } = await db
    .from("ai_tender_analyses")
    .select("analysis_json,source_updated_at")
    .eq("user_id", userId)
    .eq("source", source ?? "TED")
    .eq("source_opportunity_id", opportunityId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data || !analysisIsFresh(data.source_updated_at, sourceUpdatedAt))
    return null;
  const parsed = tenderAnalysisSchema.safeParse(data.analysis_json);
  return parsed.success ? parsed.data : null;
}
export async function persistAnalysis(
  db: SupabaseClient<Database>,
  userId: string,
  source: string | undefined,
  opportunityId: string,
  sourceUpdatedAt: string | null,
  model: string,
  analysis: TenderAnalysis,
) {
  const validated = tenderAnalysisSchema.parse(analysis);
  const { error } = await db.from("ai_tender_analyses").upsert(
    {
      user_id: userId,
      source: source ?? "TED",
      source_opportunity_id: opportunityId,
      source_updated_at: sourceUpdatedAt,
      model,
      analysis_json: validated as unknown as Json,
    },
    { onConflict: "user_id,source,source_opportunity_id,source_updated_at" },
  );
  if (error) throw error;
  return validated;
}
