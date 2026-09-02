"use client";

import { useState } from "react";
import type { ProviderDiagnostic } from "@/lib/opportunities/providers/types";

const PROVIDERS = ["TED", "UK", "SAM", "NATO"] as const;

export function ProviderDiagnosticsPanel({
  initial,
  configured,
}: {
  initial: ProviderDiagnostic[];
  configured: Record<(typeof PROVIDERS)[number], boolean>;
}) {
  const [rows, setRows] = useState(initial);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  async function runCheck() {
    setRunning(true);
    setError("");
    try {
      const response = await fetch("/api/admin/provider-check", {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Diagnostic check failed.");
      setRows(Object.values(data) as ProviderDiagnostic[]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Diagnostic check failed.");
    } finally {
      setRunning(false);
    }
  }
  return (
    <section>
      <div className="diagnostic-heading">
        <div>
          <h2>Provider diagnostics</h2>
          <p>Last safe production check. No secrets or response bodies are stored.</p>
        </div>
        <button className="black-button" onClick={runCheck} disabled={running}>
          {running ? "Checking…" : "Run bounded provider check"}
        </button>
      </div>
      {error ? <div className="auth-error">{error}</div> : null}
      <div className="provider-diagnostics-table">
        {PROVIDERS.map((provider) => {
          const row = rows.find((item) => item.provider === provider);
          return (
            <article key={provider}>
              <h3>{provider}</h3>
              <dl>
                <div><dt>Configured</dt><dd>{configured[provider] ? "Yes" : "No"}</dd></div>
                <div><dt>Last status</dt><dd>{row ? (row.status === "ok" ? "OK" : "Failed") : "Not checked"}</dd></div>
                <div><dt>Upstream status</dt><dd>{row?.upstreamStatus ?? "—"}</dd></div>
                <div><dt>Raw results</dt><dd>{row?.rawCount ?? "—"}</dd></div>
                <div><dt>Normalized</dt><dd>{row?.normalizedCount ?? "—"}</dd></div>
                <div><dt>Last checked</dt><dd>{row ? new Date(row.checkedAt).toLocaleString() : "—"}</dd></div>
              </dl>
              {row?.safeErrorMessage ? <p className="diagnostic-error">{row.safeErrorMessage}</p> : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
