import { isCronAuthorized } from "@/lib/ingestion/authorization";
import { syncAllProviders } from "@/lib/ingestion/sync-all";
import { syncProvider } from "@/lib/ingestion/sync-provider";
import type { IngestionSource } from "@/lib/ingestion/types";

export const runtime = "nodejs";
const SOURCES = new Set<IngestionSource>(["TED", "UK", "SAM"]);
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) return Response.json({ error: "Unauthorized." }, { status: 401 });
  const requested = new URL(request.url).searchParams.get("source")?.toUpperCase() as IngestionSource | undefined;
  if (requested && !SOURCES.has(requested)) return Response.json({ error: "Unsupported source." }, { status: 400 });
  const results = requested ? [await syncProvider({ source: requested })] : await syncAllProviders();
  return Response.json({ results }, { headers: { "cache-control": "no-store" } });
}
