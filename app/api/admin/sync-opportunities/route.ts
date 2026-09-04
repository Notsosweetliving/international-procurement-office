import { canAccessProviderDiagnostics } from "@/lib/admin/access";
import { syncProvider } from "@/lib/ingestion/sync-provider";
import type { IngestionSource } from "@/lib/ingestion/types";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
const SOURCES = new Set<IngestionSource>(["TED", "UK", "SAM"]);
export async function POST(request: Request) {
  const { user } = await getAuthenticatedUser();
  if (!user || !canAccessProviderDiagnostics(user.email)) return Response.json({ error: "Not authorized." }, { status: 403 });
  const body = await request.json().catch(() => null) as { source?: string } | null;
  const source = body?.source?.toUpperCase() as IngestionSource | undefined;
  if (!source || !SOURCES.has(source)) return Response.json({ error: "Unsupported source." }, { status: 400 });
  return Response.json(await syncProvider({ source }), { headers: { "cache-control": "no-store" } });
}
