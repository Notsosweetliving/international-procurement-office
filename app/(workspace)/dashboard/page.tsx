import Link from "next/link";
import { DashboardAiSearch } from "@/components/dashboard-ai-search";
import { MatchedOpportunityList } from "@/components/matched-opportunity-list";
import { isAiAvailable } from "@/lib/ai/client";
import { opportunityService } from "@/lib/opportunities/service";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { listActiveBidWorkspaces } from "@/lib/repositories/bid-workspace";
import { listSaved } from "@/lib/repositories/saved";
import { listSuppliers } from "@/lib/suppliers/repository";
import { profileCompleteness } from "@/lib/company/profile";
import { getCompanyProfile } from "@/lib/repositories/company";
import { connection } from "next/server";

export const runtime = "nodejs";
export default async function Dashboard() {
  await connection();
  const [result, auth] = await Promise.all([
    opportunityService.search({ limit: 15 }),
    getAuthenticatedUser(),
  ]);
  const issues = result.health?.filter((x) => x.status !== "ok") ?? [];
  const [workspaces, saved, suppliers, profile] =
    auth.client && auth.user
      ? await Promise.all([
          listActiveBidWorkspaces(auth.client, auth.user.id).catch(() => []),
          listSaved(auth.client, auth.user.id).catch(() => []),
          listSuppliers(auth.client, auth.user.id).catch(() => []),
          getCompanyProfile(auth.client, auth.user.id).catch(() => null),
        ])
      : [[], [], [], null];
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">WORKSPACE / GLOBAL PROCUREMENT</div>
          <h1>Intelligence</h1>
          <p>
            Official opportunities from multiple jurisdictions ranked against
            your company profile.
          </p>
        </div>
        <Link className="ghost-button" href="/company#matching-inputs">
          Tune recommendations
        </Link>
      </header>
      <DashboardAiSearch available={isAiAvailable()} />
      {profile && profileCompleteness(profile) < 70 ? (
        <div className="profile-completion-prompt">
          <span>Complete your company profile to improve matching.</span>
          <Link href="/company">Continue profile →</Link>
        </div>
      ) : null}
      <section className="supplier-dashboard-summary">
        <span className="section-label">SUPPLIER COVERAGE</span>
        <strong>{suppliers.length}</strong>
        <p>suppliers available for private fulfilment planning</p>
        <Link href="/suppliers">Open supplier directory →</Link>
      </section>
      {workspaces.length ? (
        <section className="active-bids">
          <div className="section-heading">
            <div>
              <span className="section-label">ACTIVE BIDS</span>
              <h2>
                {workspaces.length} active workspace
                {workspaces.length === 1 ? "" : "s"}
              </h2>
            </div>
          </div>
          <div>
            {workspaces.map((w) => {
              const item = saved.find(
                (s) => s.source_opportunity_id === w.source_opportunity_id,
              );
              return (
                <Link
                  href={`/opportunities/${w.source_opportunity_id}#bid-workspace`}
                  key={w.id}
                >
                  <span>
                    <b>{item?.opportunity_title ?? w.source_opportunity_id}</b>
                    <small>{String(w.decision).replaceAll("_", " ")}</small>
                  </span>
                  <strong>{w.readiness_score}% ready</strong>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
      <section>
        <div className="section-heading">
          <div>
            <span className="section-label">
              PERSONALISED MULTI-SOURCE FEED
            </span>
            <h2>Recommended for you</h2>
          </div>
          {result.items.length ? <span>Ranked from {result.items.length} unified notices</span> : null}
        </div>
        {result.items.length && issues.length ? (
          <div className="provider-warning compact">
            Some sources are temporarily unavailable. Showing results from
            working sources.
          </div>
        ) : null}
        {!result.items.length ? (
          <div className="state-card">
            <b>No live recommendations are available right now.</b>
            <p>
              Try Opportunities with a specific source, or check again shortly.
              IPO never fabricates notices.
            </p>
          </div>
        ) : (
          <MatchedOpportunityList
            items={result.items}
            mode="dashboard"
            workspaceStatuses={Object.fromEntries(
              workspaces.map((workspace) => [
                workspace.source_opportunity_id,
                {
                  decision: workspace.decision,
                  readiness: workspace.readiness_score,
                },
              ]),
            )}
          />
        )}
      </section>
    </div>
  );
}
