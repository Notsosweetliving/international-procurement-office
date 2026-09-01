import { OpportunityCard } from "@/components/opportunity-card";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { listSaved } from "@/lib/repositories/saved";
import { opportunityService } from "@/lib/opportunities/service";
import type { Opportunity, OpportunitySource } from "@/lib/opportunities/types";
export default async function Saved() {
  const { client, user } = await getAuthenticatedUser();
  if (!client || !user) return null;
  const rows = await listSaved(client, user.id);
  const items = await Promise.all(
    rows.map(async (row) => {
      const live = await opportunityService.getById(row.source_opportunity_id);
      if (live) return { opportunity: live, live: true };
      const source = (
        ["TED", "NATO", "UK", "SAM", "mock"].includes(row.source)
          ? row.source
          : "TED"
      ) as OpportunitySource;
      const snapshot: Opportunity = {
        id: row.source_opportunity_id,
        reference: row.source_opportunity_id,
        title: row.opportunity_title,
        buyer: {
          id: "",
          name: row.buyer_name ?? "Buyer unavailable",
          type: "",
          country: "",
        },
        country: "Not disclosed",
        category: "Saved opportunity",
        value: null,
        currency: null,
        publishedAt: null,
        deadline: null,
        eligibility: "Unknown",
        summary: "Live source unavailable",
        match: null,
        requirements: [],
        documents: [],
        source,
        sourceUrl: row.source_url ?? undefined,
      };
      return { opportunity: snapshot, live: false };
    }),
  );
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">SHORTLIST</div>
          <h1>Saved</h1>
          <p>
            Opportunities you are actively tracking across official sources.
          </p>
        </div>
      </header>
      {items.length ? (
        <div className="opportunity-list">
          {items.map(({ opportunity, live }) => (
            <div key={opportunity.id}>
              {!live ? (
                <div className="live-unavailable">Live source unavailable</div>
              ) : null}
              <OpportunityCard opportunity={opportunity} saved />
            </div>
          ))}
        </div>
      ) : (
        <div className="state-card">
          <h2>No saved opportunities yet</h2>
          <p>Save a public opportunity to revisit it here.</p>
        </div>
      )}
    </div>
  );
}
