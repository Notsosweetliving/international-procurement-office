import { normalizeSamNotice } from "../normalize/sam.ts";
import type { Opportunity } from "../types.ts";
import type {
  OpportunityProvider,
  OpportunitySearchParams,
  OpportunitySearchResult,
} from "./types.ts";
import {
  completeProviderRequest,
  fetchProviderJson,
  ProviderRequestError,
  unconfiguredProviderDiagnostic,
} from "../diagnostics.ts";

const BASE = (
  process.env.SAM_API_BASE_URL ?? "https://api.sam.gov/opportunities/v2"
).replace(/\/$/, "");
const DEFAULT_WINDOW_DAYS = 90;
type Obj = Record<string, unknown>;
type SamFetch = (
  input: string,
  init?: RequestInit & { next?: { revalidate: number } },
) => Promise<Response>;

export interface SamRequestOptions {
  apiKey?: string;
  fetcher?: SamFetch;
  now?: Date;
}

const dataItems = (data: unknown) =>
  data &&
  typeof data === "object" &&
  Array.isArray((data as Obj).opportunitiesData)
    ? ((data as Obj).opportunitiesData as unknown[])
    : [];

export function formatSamDate(date: Date) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}/${date.getFullYear()}`;
}

export function samPostedDateRange(
  now = new Date(),
  days = DEFAULT_WINDOW_DAYS,
) {
  const safeDays = Math.min(365, Math.max(0, Math.trunc(days)));
  const postedTo = new Date(now);
  const postedFrom = new Date(now);
  postedFrom.setDate(postedFrom.getDate() - safeDays);
  return {
    postedFrom: formatSamDate(postedFrom),
    postedTo: formatSamDate(postedTo),
  };
}

export function buildSamSearchParams(
  params: OpportunitySearchParams = {},
  now = new Date(),
  days = DEFAULT_WINDOW_DAYS,
) {
  const limit = Math.min(100, Math.max(params.limit ?? 30, 1));
  const page = Math.max(1, params.page ?? 1);
  const range = samPostedDateRange(now, days);
  const query = new URLSearchParams({
    limit: String(limit),
    offset: String((page - 1) * limit),
    postedFrom: range.postedFrom,
    postedTo: range.postedTo,
  });
  const keyword = params.query?.trim();
  if (keyword) query.set("title", keyword.slice(0, 100));
  return query;
}

export function samErrorMessage(status?: number) {
  if (status === 400) return "SAM.gov rejected the search parameters.";
  if (status === 403) return "SAM.gov rejected the API key or API access.";
  if (status === 429) return "SAM.gov rate limit reached.";
  if (status && status >= 500) return "SAM.gov is temporarily unavailable.";
  return "SAM.gov request failed.";
}

async function request(
  params: URLSearchParams,
  options: SamRequestOptions = {},
) {
  const key = (options.apiKey ?? process.env.SAM_API_KEY ?? "").trim();
  if (!key) {
    const diagnostic = await unconfiguredProviderDiagnostic("SAM");
    throw new ProviderRequestError("SAM.gov API key is not configured.", diagnostic);
  }

  const requestParams = new URLSearchParams(params);
  requestParams.set("api_key", key);
  const fetcher = options.fetcher ?? fetch;
  return fetchProviderJson("SAM", `${BASE}/search?${requestParams.toString()}`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(12000),
    next: { revalidate: 1200 },
  }, { fetcher, safeError: samErrorMessage, configured: true });
}

export async function searchSamOpportunitiesWith(
  params: OpportunitySearchParams = {},
  options: SamRequestOptions = {},
): Promise<OpportunitySearchResult> {
  try {
    const { data, context } = await request(
      buildSamSearchParams(params, options.now),
      options,
    );
    const items = dataItems(data)
      .map(normalizeSamNotice)
      .filter((item): item is Opportunity => item !== null);
    const total =
      data &&
      typeof data === "object" &&
      typeof (data as Obj).totalRecords === "number"
        ? ((data as Obj).totalRecords as number)
        : items.length;
    const rawCount = dataItems(data).length;
    const diagnostic = await completeProviderRequest(context, rawCount, items.length);
    return { items, total, diagnostic, error: diagnostic.status === "failed" ? diagnostic.safeErrorMessage : undefined };
  } catch (error) {
    const message =
      error instanceof ProviderRequestError
        ? error.message
        : "SAM.gov request failed.";
    return { items: [], total: 0, error: message, diagnostic: error instanceof ProviderRequestError ? error.diagnostic : undefined };
  }
}

export async function searchSamOpportunities(
  params: OpportunitySearchParams = {},
) {
  return searchSamOpportunitiesWith(params, {
    apiKey: process.env.SAM_API_KEY,
  });
}

export async function getSamOpportunity(id: string) {
  if (!id.startsWith("sam-") || !(process.env.SAM_API_KEY ?? "").trim())
    return null;
  const result = await searchSamOpportunities({
    query: id.slice(4),
    limit: 100,
  });
  return result.items.find((opportunity) => opportunity.id === id) ?? null;
}

export const samOpportunityProvider: OpportunityProvider = {
  source: "SAM",
  search: searchSamOpportunities,
  getById: getSamOpportunity,
};
