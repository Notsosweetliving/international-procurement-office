import { Suspense } from "react";
import { OpportunityResults } from "@/components/opportunity-results";
import { freshnessLabel, listSyncStates, searchCachedOpportunities } from "@/lib/opportunities/cache";
import type { OpportunitySource } from "@/lib/opportunities/types";
import { Icon } from "@/components/icons";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { listActiveBidWorkspaces } from "@/lib/repositories/bid-workspace";
import { connection } from "next/server";

export const runtime = "nodejs";
const SOURCES: { value: string; label: string }[] = [
  { value: "all", label: "All sources" },
  { value: "TED", label: "EU TED" },
  { value: "UK", label: "UK Government" },
  { value: "SAM", label: "US Federal" },
];
const validSource = (value: unknown): OpportunitySource[] | undefined =>
  typeof value === "string" && ["TED", "UK", "SAM"].includes(value)
    ? [value as OpportunitySource]
    : undefined;
export default async function Opportunities(
  props: PageProps<"/opportunities">,
) {
  const params = await props.searchParams;
  const q = typeof params.q === "string" ? params.q : "",
    source = typeof params.source === "string" ? params.source : "all",
    visible = 50;
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">GLOBAL PROCUREMENT / OFFICIAL SOURCES</div>
          <h1>Opportunities</h1>
          <p>
            Search EU, UK and US federal public procurement in one
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
        <Results q={q} source={source} params={params} visible={visible} />
      </Suspense>
    </div>
  );
}
const listParam = (value: string | string[] | undefined) => typeof value === "string" ? value.split(",").map((item) => item.trim()).filter(Boolean) : undefined;
const numberParam = (value: string | string[] | undefined) => typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)) ? Number(value) : undefined;
async function Results({ q, source, params, visible }: { q: string; source: string; params: Awaited<PageProps<"/opportunities">["searchParams"]>; visible: number }) {
  await connection();
  const auth = await getAuthenticatedUser();
  const closingWithinDays = numberParam(params.closingWithinDays);
  const [result, states] = auth.client ? await Promise.all([
    searchCachedOpportunities(auth.client, {
      query: q,
      sources: validSource(source),
      countries: listParam(params.countries),
      categories: listParam(params.categories),
      minValue: numberParam(params.minValue),
      maxValue: numberParam(params.maxValue),
      currency: typeof params.currency === "string" ? params.currency : undefined,
      closingWithinDays,
      sort: params.sort === "closing_soon" ? "deadline" : params.sort === "highest_value" ? "value_desc" : "newest",
      limit: visible,
    }),
    listSyncStates(auth.client),
  ]) : [{ items: [], total: 0 }, []];
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
    : "Procurement opportunities";
  const appendParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (typeof value === "string") appendParams.set(key, value);
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
        <span className="source-coming-soon">NATO — coming soon</span>
      </div>
      <div className="results-summary">
        <div>
          <h2>{title}</h2>
          <p>
            {result.items.length
              ? `${result.total} cached procurement result${result.total === 1 ? "" : "s"}`
              : "No matching opportunities found"}
          </p>
        </div>
        <span>
          {source === "all"
            ? freshnessLabel(states)
            : source === "SAM" && result.items.length
              ? `US Federal · ${freshnessLabel(states, "SAM").replace(/^Updated /, "last refreshed ")}`
              : SOURCES.find((x) => x.value === source)?.label}
        </span>
      </div>
      {result.items.length ? (
        <OpportunityResults initialItems={result.items} total={result.total} query={appendParams.toString()} workspaceStatuses={workspaceStatuses} />
      ) : (
        <div className="state-card">
          <b>{source === "SAM" ? "US Federal data is temporarily delayed" : "No matching opportunities found."}</b>
          <p>
            {source === "SAM" ? "Previously cached opportunities will remain available after a successful refresh." : "Try a broader keyword such as software, construction or vehicles."}
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
