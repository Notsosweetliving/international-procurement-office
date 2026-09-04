import { normalizeTedNotice, tedOpportunityId } from "../normalize/ted";
import type { Opportunity } from "../types";
import type {
  OpportunityProvider,
  OpportunitySearchParams,
  OpportunitySearchResult,
  TedSearchResponse,
} from "./types";
import {
  completeProviderRequest,
  fetchProviderJson,
  ProviderRequestError,
} from "../diagnostics";
import { tedSearchUrl } from "../provider-urls";
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
): Promise<{ data: TedSearchResponse; context: Awaited<ReturnType<typeof fetchProviderJson>>["context"] }> {
  const { data, context } = await fetchProviderJson("TED", tedSearchUrl(), {
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
  }, { safeError: (status) => status ? `TED request failed (${status}).` : "TED request failed." });
  if (!data || typeof data !== "object") throw new Error("TED returned an invalid response");
  return { data: data as TedSearchResponse, context };
}
export async function searchTedOpportunities(
  params: OpportunitySearchParams = {},
): Promise<OpportunitySearchResult> {
  const page = Math.max(1, Math.floor(params.page ?? 1));
  const limit = Math.min(100, Math.max(1, Math.floor(params.limit ?? 20)));
  try {
    const { data, context } = await request(safeQuery(params.query), page, limit);
    const raw = Array.isArray(data.notices) ? data.notices : [];
    const items = raw
      .map(normalizeTedNotice)
      .filter((x): x is Opportunity => x !== null);
    const diagnostic = await completeProviderRequest(context, raw.length, items.length);
    return {
      items,
      total:
        typeof data.totalNoticeCount === "number"
          ? data.totalNoticeCount
          : items.length,
      diagnostic,
      error: diagnostic.status === "failed" ? diagnostic.safeErrorMessage : undefined,
    };
  } catch (error) {
    return {
      items: [],
      total: 0,
      error: error instanceof ProviderRequestError ? error.message : "TED response processing failed.",
      diagnostic: error instanceof ProviderRequestError ? error.diagnostic : undefined,
    };
  }
}
export async function getTedOpportunity(
  id: string,
): Promise<Opportunity | null> {
  const publication = id.startsWith("ted-") ? id.slice(4) : id;
  if (tedOpportunityId(publication) !== id) return null;
  try {
    const { data, context } = await request(`publication-number = ${publication}`, 1, 1);
    const notices = Array.isArray(data.notices) ? data.notices : [];
    const item = normalizeTedNotice(notices[0]);
    await completeProviderRequest(context, notices.length, item ? 1 : 0);
    return item;
  } catch {
    return null;
  }
}
export const tedOpportunityProvider: OpportunityProvider = {
  source: "TED",
  search: searchTedOpportunities,
  getById: getTedOpportunity,
};
