import { normalizeUkRelease } from "../normalize/uk";
import type { Opportunity } from "../types";
import type {
  OpportunityProvider,
  OpportunitySearchParams,
  OpportunitySearchResult,
} from "./types";
import {
  completeProviderRequest,
  fetchProviderJson,
  ProviderRequestError,
} from "../diagnostics";
import { ukFtsUrl } from "../provider-urls";
type Obj = Record<string, unknown>;
const releases = (data: unknown) =>
  data && typeof data === "object" && Array.isArray((data as Obj).releases)
    ? ((data as Obj).releases as unknown[])
    : [];
async function request(path: string) {
  return fetchProviderJson("UK", ukFtsUrl(path), {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(12000),
    next: { revalidate: 1200 },
  }, { safeError: (status) => status ? `Find a Tender request failed (${status}).` : "Find a Tender request failed." });
}
export async function searchUkOpportunities(
  params: OpportunitySearchParams = {},
): Promise<OpportunitySearchResult> {
  try {
    const limit = Math.min(100, Math.max(params.limit ?? 30, 30));
    const { data, context } = await request(
      `/ocdsReleasePackages?limit=${limit}&stages=tender`,
    );
    let items = releases(data)
      .map(normalizeUkRelease)
      .filter((x): x is Opportunity => x !== null);
    const normalizedCount = items.length;
    if (params.query) {
      const q = params.query.toLowerCase();
      items = items.filter((o) =>
        (o.title + " " + o.summary + " " + o.buyer.name)
          .toLowerCase()
          .includes(q),
      );
    }
    const visible = items.slice(0, params.limit ?? 30);
    const diagnostic = await completeProviderRequest(context, releases(data).length, normalizedCount);
    return { items: visible, total: items.length, diagnostic, error: diagnostic.status === "failed" ? diagnostic.safeErrorMessage : undefined };
  } catch (error) {
    return {
      items: [],
      total: 0,
      error: error instanceof ProviderRequestError ? error.message : "UK response processing failed.",
      diagnostic: error instanceof ProviderRequestError ? error.diagnostic : undefined,
    };
  }
}
export async function getUkOpportunity(id: string) {
  if (!id.startsWith("uk-")) return null;
  try {
    const { data, context } = await request(
      `/ocdsReleasePackages/${encodeURIComponent(id.slice(3))}`,
    );
    const raw = releases(data);
    const item = raw.map(normalizeUkRelease).find(Boolean) ?? null;
    await completeProviderRequest(context, raw.length, item ? 1 : 0);
    return item;
  } catch {
    return null;
  }
}
export const ukOpportunityProvider: OpportunityProvider = {
  source: "UK",
  search: searchUkOpportunities,
  getById: getUkOpportunity,
};
