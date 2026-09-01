import { normalizeNatoOpportunity } from "../normalize/nato";
import type { Opportunity } from "../types";
import type {
  OpportunityProvider,
  OpportunitySearchParams,
  OpportunitySearchResult,
} from "./types";
type Obj = Record<string, unknown>;
async function load() {
  const endpoint = process.env.NATO_OPPORTUNITIES_URL;
  if (!endpoint)
    throw new Error("No approved structured NATO endpoint is configured");
  const response = await fetch(endpoint, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(12000),
    next: { revalidate: 3600 },
  });
  if (!response.ok) throw new Error(`NATO feed failed (${response.status})`);
  const data: unknown = await response.json();
  return Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as Obj).items)
      ? ((data as Obj).items as unknown[])
      : [];
}
export async function searchNatoOpportunities(
  params: OpportunitySearchParams = {},
): Promise<OpportunitySearchResult> {
  try {
    let items = (await load())
      .map(normalizeNatoOpportunity)
      .filter((x): x is Opportunity => x !== null);
    if (params.query) {
      const q = params.query.toLowerCase();
      items = items.filter((o) =>
        (o.title + " " + o.summary).toLowerCase().includes(q),
      );
    }
    return { items: items.slice(0, params.limit ?? 30), total: items.length };
  } catch {
    return {
      items: [],
      total: 0,
      error:
        "NATO opportunities require an approved structured feed; the official NCIA bulletin remains available.",
    };
  }
}
export async function getNatoOpportunity(id: string) {
  if (!id.startsWith("nato-")) return null;
  const result = await searchNatoOpportunities({ limit: 100 });
  return result.items.find((o) => o.id === id) ?? null;
}
export const natoOpportunityProvider: OpportunityProvider = {
  source: "NATO",
  search: searchNatoOpportunities,
  getById: getNatoOpportunity,
};
