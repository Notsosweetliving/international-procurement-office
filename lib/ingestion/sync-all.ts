import { createIngestionClient, syncProvider } from "./sync-provider";
export async function syncAllProviders() {
  const client = createIngestionClient();
  const results = [];
  for (const source of ["TED", "UK", "SAM"] as const) results.push(await syncProvider({ source }, client));
  return results;
}
