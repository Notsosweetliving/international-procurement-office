import { getAuthenticatedUser } from "@/lib/supabase/server";
import { listSavedSearches } from "@/lib/saved-searches/repository";
import { SavedSearchManager } from "@/components/saved-search-manager";
export default async function SavedSearches() {
  const { client, user } = await getAuthenticatedUser();
  let setupRequired = false;
  const rows =
    client && user
      ? await listSavedSearches(client, user.id).catch(() => {
          setupRequired = true;
          return [];
        })
      : [];
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">MONITORING</div>
          <h1>Saved searches</h1>
          <p>
            Rerun useful opportunity searches and configure queued daily or
            weekly alerts.
          </p>
        </div>
      </header>
      {setupRequired ? (
        <div className="provider-warning">
          Apply the V1.0 Supabase migration to activate saved searches.
        </div>
      ) : null}
      <SavedSearchManager initial={rows} setupRequired={setupRequired} />
    </div>
  );
}
