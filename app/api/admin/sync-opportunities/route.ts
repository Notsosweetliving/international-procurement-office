import { canAccessProviderDiagnostics } from "@/lib/admin/access";
import { syncProvider } from "@/lib/ingestion/sync-provider";
import type { IngestionSource } from "@/lib/ingestion/types";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { serverLog } from "@/lib/monitoring/logger";

export const runtime = "nodejs";
const SOURCES = new Set<IngestionSource>(["TED", "UK", "SAM"]);
export async function POST(request: Request) {
  let source: IngestionSource | undefined;
  serverLog("info", "admin_sync_started", { stage: "request_received" });
  try {
    const { user } = await getAuthenticatedUser();
    if (!user || !canAccessProviderDiagnostics(user.email)) {
      serverLog("warn", "admin_sync_failed", { stage: "authentication", safe_error_name: "Unauthorized", safe_error_message: "Not authorized." });
      return Response.json({ ok: false, source: null, error: "Not authorized." }, { status: 403 });
    }
    serverLog("info", "admin_sync_authenticated", { stage: "authentication" });
    const rawSource = new URL(request.url).searchParams.get("source")?.trim().toUpperCase();
    source = rawSource as IngestionSource | undefined;
    if (!source || !SOURCES.has(source)) return Response.json({ ok: false, source: rawSource ?? null, error: "Unsupported source." }, { status: 400 });
    serverLog("info", "admin_sync_source_validated", { source, stage: "source_validation" });
    serverLog("info", "admin_sync_ingestion_started", { source, stage: "ingestion" });
    const result = await syncProvider({ source });
    const ok = result.status === "success" || result.status === "disabled";
    serverLog(ok ? "info" : "warn", ok ? "admin_sync_ingestion_completed" : "admin_sync_failed", { source, stage: "ingestion", safe_error_name: result.status, safe_error_message: result.safeError ?? null });
    return Response.json({ ok, ...result, error: ok ? undefined : result.safeError ?? "Synchronization failed." }, { status: ok ? 200 : 502, headers: { "cache-control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Synchronization failed.";
    serverLog("error", "admin_sync_failed", { source: source ?? null, stage: "route", safe_error_name: error instanceof Error ? error.name : "UnknownError", safe_error_message: message });
    return Response.json({ ok: false, source: source ?? null, error: message }, { status: 500, headers: { "cache-control": "no-store" } });
  }
}
