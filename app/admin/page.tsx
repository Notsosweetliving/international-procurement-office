import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin/access";
import {
  getLastProviderDiagnostics,
  providerConfiguration,
} from "@/lib/opportunities/diagnostics";
import { ProviderDiagnosticsPanel } from "@/components/provider-diagnostics-panel";
import { serverLog } from "@/lib/monitoring/logger";
import { IngestionStatusPanel } from "@/components/ingestion-status-panel";
import {
  getCustomerDirectory,
  type CustomerDirectoryRow,
} from "@/lib/admin/customer-directory";

export const runtime = "nodejs";
export default async function Admin({
  searchParams,
}: PageProps<"/admin">) {
  const { user } = await getAuthenticatedUser();
  const matchesAdminList = isAdminEmail(user?.email);
  serverLog("info", "admin_route_reached", {
    authenticated: user ? "yes" : "no",
    admin_emails_configured: process.env.ADMIN_EMAILS?.trim() ? "yes" : "no",
    current_user_matches_admin_list: matchesAdminList ? "yes" : "no",
  });
  if (!user || !matchesAdminList) notFound();
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
  let syncStates: import("@/lib/opportunities/cache").SyncState[] = [];
  const cacheCounts: Record<string, number> = {};
  let customers: CustomerDirectoryRow[] = [];
  let directoryError = false;
  if (url && key) {
    const params = await searchParams;
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
    const [stateResult, ...countResults] = await Promise.all([
      db.from("procurement_source_sync_state").select("*"),
      ...["TED", "UK", "SAM"].map((source) => db.from("procurement_opportunities").select("id", { count: "exact", head: true }).eq("source", source)),
    ]);
    syncStates = stateResult.data ?? [];
    ["TED", "UK", "SAM"].forEach((source, index) => { cacheCounts[source] = countResults[index].count ?? 0; });
    try {
      customers = await getCustomerDirectory(db, {
        search: typeof params.customer === "string" ? params.customer : "",
        signupDate: typeof params.signup === "string" ? params.signup : "",
        marketing:
          params.marketing === "yes" || params.marketing === "no"
            ? params.marketing
            : "all",
      });
    } catch {
      directoryError = true;
    }
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
      <section className="customer-directory">
        <div className="directory-heading">
          <div><h2>Users &amp; companies</h2><p>Private account directory. Last active uses the latest reliable authentication sign-in time.</p></div>
          <strong>{customers.length} shown</strong>
        </div>
        <form className="directory-filters">
          <label>Search<input name="customer" placeholder="Email or company" defaultValue={typeof (await searchParams).customer === "string" ? (await searchParams).customer : ""} /></label>
          <label>Signup date<input name="signup" type="date" defaultValue={typeof (await searchParams).signup === "string" ? (await searchParams).signup : ""} /></label>
          <label>Marketing<select name="marketing" defaultValue={typeof (await searchParams).marketing === "string" ? (await searchParams).marketing : "all"}><option value="all">All</option><option value="yes">Opted in</option><option value="no">Not opted in</option></select></label>
          <button className="ghost-button">Apply filters</button>
        </form>
        {directoryError ? <p>Customer directory is temporarily unavailable.</p> : (
          <div className="directory-table-wrap"><table><thead><tr><th>Email</th><th>Signup</th><th>Last active</th><th>Company</th><th>Country</th><th>Profile</th><th>Plan</th><th>Marketing emails</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer.id}><td>{customer.email}</td><td>{new Date(customer.signupAt).toLocaleDateString()}</td><td>{customer.lastActiveAt ? new Date(customer.lastActiveAt).toLocaleDateString() : "—"}</td><td>{customer.company}</td><td>{customer.country}</td><td>{customer.completeness}%</td><td>{customer.plan.replace("_", " ")}</td><td>{customer.marketingOptIn ? "Opted in" : "Not opted in"}</td></tr>)}</tbody></table></div>
        )}
      </section>
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
          {process.env.SAM_SYNC_ENABLED?.trim().toLowerCase() === "true"
            ? "SAM synchronization is enabled and respects upstream rate limits."
            : "SAM synchronization is disabled."}
        </small>
      </section>
      <ProviderDiagnosticsPanel
        initial={diagnostics}
        configuration={providerConfiguration()}
      />
      <IngestionStatusPanel
        initial={syncStates}
        counts={cacheCounts}
        samConfigured={Boolean(process.env.SAM_API_KEY?.trim())}
        samEnabled={process.env.SAM_SYNC_ENABLED?.trim().toLowerCase() === "true"}
      />
    </main>
  );
}
