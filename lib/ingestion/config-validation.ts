export function validateIngestionConfig(rawUrl?: string, rawKey?: string) {
  const url = rawUrl?.trim(), key = rawKey?.trim();
  if (!url) throw new Error("Supabase URL is invalid or not configured.");
  let parsed: URL;
  try { parsed = new URL(url); } catch { throw new Error("Supabase URL is invalid or not configured."); }
  if (parsed.protocol !== "https:" || !parsed.hostname) throw new Error("Supabase URL is invalid or not configured.");
  if (!key) throw new Error("Supabase service-role key is not configured for ingestion.");
  return { url, key };
}
