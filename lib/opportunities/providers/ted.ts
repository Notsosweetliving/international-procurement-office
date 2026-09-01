import { normalizeTedNotice, tedOpportunityId } from "../normalize/ted";
import type { Opportunity } from "../types";
import type {
  OpportunityProvider,
  OpportunitySearchParams,
  OpportunitySearchResult,
  TedSearchResponse,
} from "./types";
const BASE = (
  process.env.TED_API_BASE_URL ?? "https://api.ted.europa.eu"
).replace(/\/$/, "");
const FIELDS = [
  "publication-number",
  "notice-title",
  "buyer-name",
  "buyer-country",
  "place-of-performance-country-proc",
  "description-proc",
  "description-lot",
  "publication-date",
  "deadline",
  "deadline-receipt-tender-date-lot",
  "estimated-value-proc",
  "estimated-value-cur-proc",
  "classification-cpv",
  "procedure-type",
];
const safeQuery = (q?: string) => {
  const cleaned = q
    ?.replace(/[^\p{L}\p{N}\s._-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
  return cleaned
    ? `FT ~ "${cleaned}" SORT BY publication-date DESC`
    : "OJ = () SORT BY publication-date DESC";
};
async function request(
  query: string,
  page: number,
  limit: number,
): Promise<TedSearchResponse> {
  const response = await fetch(`${BASE}/v3/notices/search`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      query,
      fields: FIELDS,
      page,
      limit,
      scope: "ACTIVE",
      checkQuerySyntax: false,
      paginationMode: "PAGE_NUMBER",
    }),
    signal: AbortSignal.timeout(10000),
    next: { revalidate: 1800 },
  });
  if (!response.ok) throw new Error(`TED request failed (${response.status})`);
  const data: unknown = await response.json();
  if (!data || typeof data !== "object")
    throw new Error("TED returned an invalid response");
  return data as TedSearchResponse;
}
export async function searchTedOpportunities(
  params: OpportunitySearchParams = {},
): Promise<OpportunitySearchResult> {
  const page = Math.max(1, Math.floor(params.page ?? 1));
  const limit = Math.min(100, Math.max(1, Math.floor(params.limit ?? 20)));
  try {
    const data = await request(safeQuery(params.query), page, limit);
    const raw = Array.isArray(data.notices) ? data.notices : [];
    const items = raw
      .map(normalizeTedNotice)
      .filter((x): x is Opportunity => x !== null);
    return {
      items,
      total:
        typeof data.totalNoticeCount === "number"
          ? data.totalNoticeCount
          : items.length,
    };
  } catch (error) {
    if (process.env.NODE_ENV === "development")
      console.error("[ContractOS TED]", error);
    return {
      items: [],
      total: 0,
      error: "We couldn't reach the procurement source. Try again shortly.",
    };
  }
}
export async function getTedOpportunity(
  id: string,
): Promise<Opportunity | null> {
  const publication = id.startsWith("ted-") ? id.slice(4) : id;
  if (tedOpportunityId(publication) !== id) return null;
  try {
    const data = await request(`publication-number = ${publication}`, 1, 1);
    const notices = Array.isArray(data.notices) ? data.notices : [];
    return normalizeTedNotice(notices[0]);
  } catch (error) {
    if (process.env.NODE_ENV === "development")
      console.error("[ContractOS TED detail]", error);
    return null;
  }
}
export const tedOpportunityProvider: OpportunityProvider = {
  source: "TED",
  search: searchTedOpportunities,
  getById: getTedOpportunity,
};
