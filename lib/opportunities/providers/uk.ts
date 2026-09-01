import { normalizeUkRelease } from "../normalize/uk";
import type { Opportunity } from "../types";
import type {
  OpportunityProvider,
  OpportunitySearchParams,
  OpportunitySearchResult,
} from "./types";
const BASE = (
  process.env.UK_FTS_API_BASE_URL ??
  "https://www.find-tender.service.gov.uk/api/1.0"
).replace(/\/$/, "");
type Obj = Record<string, unknown>;
const releases = (data: unknown) =>
  data && typeof data === "object" && Array.isArray((data as Obj).releases)
    ? ((data as Obj).releases as unknown[])
    : [];
async function request(path: string) {
  const response = await fetch(BASE + path, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(12000),
    next: { revalidate: 1200 },
  });
  if (!response.ok)
    throw new Error(`UK Find a Tender request failed (${response.status})`);
  return response.json() as Promise<unknown>;
}
export async function searchUkOpportunities(
  params: OpportunitySearchParams = {},
): Promise<OpportunitySearchResult> {
  try {
    const limit = Math.min(100, Math.max(params.limit ?? 30, 30));
    const data = await request(
      `/ocdsReleasePackages?limit=${limit}&stages=tender`,
    );
    let items = releases(data)
      .map(normalizeUkRelease)
      .filter((x): x is Opportunity => x !== null);
    if (params.query) {
      const q = params.query.toLowerCase();
      items = items.filter((o) =>
        (o.title + " " + o.summary + " " + o.buyer.name)
          .toLowerCase()
          .includes(q),
      );
    }
    return { items: items.slice(0, params.limit ?? 30), total: items.length };
  } catch (error) {
    if (process.env.NODE_ENV === "development")
      console.error("[ContractOS UK]", error);
    return {
      items: [],
      total: 0,
      error: "UK procurement source is temporarily unavailable.",
    };
  }
}
export async function getUkOpportunity(id: string) {
  if (!id.startsWith("uk-")) return null;
  try {
    const data = await request(
      `/ocdsReleasePackages/${encodeURIComponent(id.slice(3))}`,
    );
    return releases(data).map(normalizeUkRelease).find(Boolean) ?? null;
  } catch {
    return null;
  }
}
export const ukOpportunityProvider: OpportunityProvider = {
  source: "UK",
  search: searchUkOpportunities,
  getById: getUkOpportunity,
};
