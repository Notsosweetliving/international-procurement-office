import { Suspense } from "react";
import { MatchedOpportunityList } from "@/components/matched-opportunity-list";
import { opportunityService } from "@/lib/opportunities/service";
import type { OpportunitySource } from "@/lib/opportunities/types";
import { Icon } from "@/components/icons";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { listActiveBidWorkspaces } from "@/lib/repositories/bid-workspace";
const SOURCES: { value: string; label: string }[] = [
  { value: "all", label: "All sources" },
  { value: "TED", label: "EU TED" },
  { value: "NATO", label: "NATO" },
  { value: "UK", label: "UK Government" },
  { value: "SAM", label: "US Federal" },
];
const validSource = (value: unknown): OpportunitySource[] | undefined =>
  typeof value === "string" && ["TED", "NATO", "UK", "SAM"].includes(value)
    ? [value as OpportunitySource]
    : undefined;
export default async function Opportunities(
  props: PageProps<"/opportunities">,
) {
  const params = await props.searchParams;
  const q = typeof params.q === "string" ? params.q : "",
    source = typeof params.source === "string" ? params.source : "all";
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">GLOBAL PROCUREMENT / OFFICIAL SOURCES</div>
          <h1>Opportunities</h1>
          <p>
            Search EU, NATO, UK and US federal public procurement in one
            workspace.
          </p>
        </div>
      </header>
      <form className="search-wide source-search" action="/opportunities">
        <Icon name="search" />
        <input
          name="q"
          defaultValue={q}
          aria-label="Search opportunities"
          placeholder="Search software, networking, vehicles…"
        />
        <label>
          <span className="sr-only">Procurement source</span>
          <select name="source" defaultValue={source}>
            {SOURCES.map((x) => (
              <option value={x.value} key={x.value}>
                {x.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Search</button>
      </form>
      <Suspense fallback={<Loading />}>
        <Results q={q} source={source} />
      </Suspense>
    </div>
  );
}
async function Results({ q, source }: { q: string; source: string }) {
  const [result, auth] = await Promise.all([
    opportunityService.search({
      query: q,
      sources: validSource(source),
      limit: 20,
    }),
    getAuthenticatedUser(),
  ]);
  const workspaces =
    auth.client && auth.user
      ? await listActiveBidWorkspaces(auth.client, auth.user.id).catch(() => [])
      : [];
  const workspaceStatuses = Object.fromEntries(
    workspaces.map((workspace) => [
      workspace.source_opportunity_id,
      { decision: workspace.decision, readiness: workspace.readiness_score },
    ]),
  );
  const title = q
    ? `${q[0]?.toUpperCase() ?? ""}${q.slice(1)} opportunities`
    : "Live opportunities";
  const issues = result.health?.filter((x) => x.status !== "ok") ?? [];
  return (
    <>
      <div className="source-pills">
        {SOURCES.map((x) => (
          <a
            className={source === x.value ? "active" : ""}
            href={`/opportunities?${new URLSearchParams({ q, source: x.value })}`}
            key={x.value}
          >
            {x.label}
          </a>
        ))}
      </div>
      <div className="results-summary">
        <div>
          <h2>{title}</h2>
          <p>
            {result.items.length
              ? `${result.items.length} unified live results`
              : "No live results"}
          </p>
        </div>
        <span>
          {source === "all"
            ? "EU TED · NATO · UK GOV · US FEDERAL"
            : SOURCES.find((x) => x.value === source)?.label}
        </span>
      </div>
      {result.items.length && issues.length ? (
        <div className="provider-warning compact">
          Some selected sources are temporarily unavailable. Showing verified
          results from working sources.
        </div>
      ) : null}
      {result.error && !result.items.length ? (
        <div className="state-card error-state">
          <b>No live opportunities are available from the selected source.</b>
          <p>
            Choose another source or try again shortly. IPO does not substitute
            sample notices.
          </p>
        </div>
      ) : result.items.length ? (
        <MatchedOpportunityList
          items={result.items}
          workspaceStatuses={workspaceStatuses}
        />
      ) : (
        <div className="state-card">
          <b>No opportunities matched your search.</b>
          <p>
            Try a broader keyword such as software, construction or vehicles.
          </p>
        </div>
      )}
    </>
  );
}
function Loading() {
  return (
    <div className="results-loading">
      {[1, 2, 3].map((x) => (
        <div key={x} />
      ))}
    </div>
  );
}
