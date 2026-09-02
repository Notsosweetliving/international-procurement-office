import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin/access";
import {
  getLastProviderDiagnostics,
  providerConfiguration,
} from "@/lib/opportunities/diagnostics";
import { ProviderDiagnosticsPanel } from "@/components/provider-diagnostics-panel";

export const runtime = "nodejs";
export default async function Admin() {
  const { user } = await getAuthenticatedUser();
  if (!user || !isAdminEmail(user.email)) notFound();
  const diagnostics = await getLastProviderDiagnostics();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const metrics: Record<string, number | null> = {
    users: null,
    companies: null,
    activeWorkspaces: null,
    aiUsage: null,
    savedSearches: null,
    subscriptions: null,
  };
  if (url && key) {
    const db = createClient(url, key, { auth: { persistSession: false } }),
      queries = await Promise.all([
        db.auth.admin.listUsers({ page: 1, perPage: 1 }),
        db.from("companies").select("id", { count: "exact", head: true }),
        db
          .from("bid_workspaces")
          .select("id", { count: "exact", head: true })
          .neq("decision", "no_bid"),
        db
          .from("usage_events")
          .select("id", { count: "exact", head: true })
          .in("event_type", ["ai_analysis", "ai_question"]),
        db.from("saved_searches").select("id", { count: "exact", head: true }),
        db
          .from("subscription_accounts")
          .select("user_id", { count: "exact", head: true })
          .eq("plan", "pro"),
      ]);
    metrics.users = queries[0].data.users.length;
    metrics.companies = queries[1].count;
    metrics.activeWorkspaces = queries[2].count;
    metrics.aiUsage = queries[3].count;
    metrics.savedSearches = queries[4].count;
    metrics.subscriptions = queries[5].count;
  }
  return (
    <main className="admin-page">
      <header>
        <span className="section-label">PRIVATE BETA OPERATIONS</span>
        <h1>IPO admin</h1>
        <p>
          Aggregate diagnostics only. Tender documents and private supplier
          notes are excluded.
        </p>
      </header>
      <div className="admin-metrics">
        {Object.entries(metrics).map(([k, v]) => (
          <article key={k}>
            <span>{k.replace(/([A-Z])/g, " $1")}</span>
            <strong>{v ?? "—"}</strong>
          </article>
        ))}
      </div>
      <section>
        <h2>Source health</h2>
        <div className="source-health">
          {[
            ["TED", true],
            ["UK", true],
            ["SAM", Boolean(process.env.SAM_API_KEY)],
            ["NATO", Boolean(process.env.NATO_OPPORTUNITIES_URL)],
          ].map(([name, configured]) => (
            <p key={String(name)}>
              <b>{String(name)}</b>
              <span>
                {configured ? "Configured" : "Configuration required"}
              </span>
            </p>
          ))}
        </div>
        <small>
          SAM is not probed from this page. Runtime 429 handling remains active.
        </small>
      </section>
      <ProviderDiagnosticsPanel
        initial={diagnostics}
        configured={providerConfiguration()}
      />
    </main>
  );
}
