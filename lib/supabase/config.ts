export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
export const SUPABASE_SETUP_MESSAGE =
  "Supabase is not configured for this environment.";
