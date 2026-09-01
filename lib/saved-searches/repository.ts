import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";
import type { savedSearchSchema } from "./validation.ts";
type Input = z.infer<typeof savedSearchSchema>;
export async function listSavedSearches(db: SupabaseClient, userId: string) {
  const { data, error } = await db
    .from("saved_searches")
    .select("*,saved_search_alerts(frequency)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function createSavedSearch(
  db: SupabaseClient,
  userId: string,
  input: Input,
) {
  const { data, error } = await db
    .from("saved_searches")
    .insert({
      user_id: userId,
      name: input.name,
      query: input.query,
      sources: input.sources,
      countries: input.countries,
      categories: input.categories,
      min_value: input.minValue,
      max_value: input.maxValue,
      match_threshold: input.matchThreshold,
      sorting: input.sorting,
    })
    .select("*")
    .single();
  if (error) throw error;
  const { error: alertError } = await db.from("saved_search_alerts").insert({
    saved_search_id: data.id,
    user_id: userId,
    frequency: input.alertFrequency,
  });
  if (alertError) throw alertError;
  return data;
}
export async function renameSavedSearch(
  db: SupabaseClient,
  userId: string,
  id: string,
  name: string,
) {
  const { error } = await db
    .from("saved_searches")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}
export async function deleteSavedSearch(
  db: SupabaseClient,
  userId: string,
  id: string,
) {
  const { error } = await db
    .from("saved_searches")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}
