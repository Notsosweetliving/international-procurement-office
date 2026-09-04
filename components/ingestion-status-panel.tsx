"use client";
import { useState } from "react";
import type { SyncState } from "@/lib/opportunities/cache";
import { adminSyncUrl, parseAdminSyncResponse } from "@/lib/admin/sync-client";

const SOURCES = ["TED", "UK", "SAM"] as const;
export function IngestionStatusPanel({ initial, counts }: { initial: SyncState[]; counts: Record<string, number> }) {
  const [states, setStates] = useState(initial), [running, setRunning] = useState<string | null>(null), [error, setError] = useState("");
  async function sync(source: string) {
    setRunning(source); setError("");
    try {
      const response = await fetch(adminSyncUrl(source), { method: "POST" });
      const result = await parseAdminSyncResponse(response);
      if (!response.ok) throw new Error(result.error ?? "Sync failed.");
      const now = new Date().toISOString();
      setStates((current) => current.map((row) => row.source === source ? { ...row, last_attempt_at: now, last_success_at: result.status === "success" ? now : row.last_success_at, records_fetched: result.recordsFetched, records_inserted: result.recordsInserted, records_updated: result.recordsUpdated, is_stale: result.status !== "success", last_safe_error: result.safeError ?? null, last_error_type: result.status === "success" ? null : result.status } : row));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Sync failed."); } finally { setRunning(null); }
  }
  return <section><h2>Procurement ingestion</h2>{error ? <div className="auth-error">{error}</div> : null}<div className="provider-diagnostics-table">
    {SOURCES.map((source) => { const state = states.find((x) => x.source === source); return <article key={source}><h3>{source}</h3><dl>
      <div><dt>Last successful sync</dt><dd>{state?.last_success_at ? new Date(state.last_success_at).toLocaleString() : "Never"}</dd></div>
      <div><dt>Records cached</dt><dd>{counts[source] ?? 0}</dd></div>
      <div><dt>Freshness</dt><dd>{state?.is_stale ? "Stale" : "Current"}</dd></div>
      <div><dt>Last fetched</dt><dd>{state?.records_fetched ?? 0}</dd></div>
    </dl>{state?.last_safe_error ? <p className="diagnostic-error">{state.last_safe_error}</p> : null}<button className="black-button" disabled={Boolean(running)} onClick={() => sync(source)}>{running === source ? "Syncing…" : `Sync ${source}`}</button></article>; })}
    <article><h3>NATO</h3><p>Integration-ready. No approved feed configured and no scraping is performed.</p></article>
  </div></section>;
}
