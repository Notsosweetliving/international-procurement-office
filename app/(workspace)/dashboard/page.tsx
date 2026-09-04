import { DashboardAiSearch } from "@/components/dashboard-ai-search";
import { MatchedOpportunityList } from "@/components/matched-opportunity-list";
import { isAiAvailable } from "@/lib/ai/client";
import { freshnessLabel, listSyncStates, searchCachedOpportunities } from "@/lib/opportunities/cache";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { profileCompleteness } from "@/lib/company/profile";
import { getCompanyProfile } from "@/lib/repositories/company";
import { connection } from "next/server";

export const runtime = "nodejs";
export default async function Dashboard() {
  await connection();
  const auth = await getAuthenticatedUser();
  const [result, syncStates] = auth.client ? await Promise.all([
    searchCachedOpportunities(auth.client, { limit: 50 }),
    listSyncStates(auth.client),
  ]) : [{ items: [], total: 0 }, []];
  const profile =
    auth.client && auth.user
      ? await getCompanyProfile(auth.client, auth.user.id).catch(() => null)
      : null;
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
      </header>
      <DashboardAiSearch available={isAiAvailable()} />
      {profile && profileCompleteness(profile) < 70 ? (
        <div className="profile-completion-prompt">
          <span>Complete your company profile to improve matching.</span>
          <a href="/company">Continue profile →</a>
        </div>
      ) : null}
      <section>
        <div className="section-heading">
          <div>
            <span className="section-label">
              PERSONALISED MULTI-SOURCE FEED
            </span>
            <h2>Recommended for you</h2>
          </div>
          {result.items.length ? <span>{freshnessLabel(syncStates)} · ranked from {result.items.length} notices</span> : null}
        </div>
        {!result.items.length ? (
          <div className="state-card">
            <b>No matching opportunities found.</b>
            <p>
              Broaden your company profile or check again after the next data refresh.
            </p>
          </div>
        ) : (
          <MatchedOpportunityList
            items={result.items}
            mode="dashboard"
          />
        )}
      </section>
    </div>
  );
}
