import { normalizeNatoOpportunity } from "../normalize/nato";
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
  unconfiguredProviderDiagnostic,
} from "../diagnostics";
type Obj = Record<string, unknown>;
async function load() {
  const endpoint = process.env.NATO_OPPORTUNITIES_URL;
  if (!endpoint) {
    const diagnostic = await unconfiguredProviderDiagnostic("NATO");
    throw new ProviderRequestError("No approved structured NATO endpoint is configured.", diagnostic);
  }
  const { data, context } = await fetchProviderJson("NATO", endpoint, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(12000),
    next: { revalidate: 3600 },
  }, { safeError: (status) => status ? `NATO feed failed (${status}).` : "NATO feed failed." });
  const items = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as Obj).items)
      ? ((data as Obj).items as unknown[])
      : [];
  return { items, context };
}
export async function searchNatoOpportunities(
  params: OpportunitySearchParams = {},
): Promise<OpportunitySearchResult> {
  try {
    const loaded = await load();
    let items = loaded.items
      .map(normalizeNatoOpportunity)
      .filter((x): x is Opportunity => x !== null);
    const normalizedCount = items.length;
    if (params.query) {
      const q = params.query.toLowerCase();
      items = items.filter((o) =>
        (o.title + " " + o.summary).toLowerCase().includes(q),
      );
    }
    const visible = items.slice(0, params.limit ?? 30);
    const diagnostic = await completeProviderRequest(loaded.context, loaded.items.length, normalizedCount);
    return { items: visible, total: items.length, diagnostic, error: diagnostic.status === "failed" ? diagnostic.safeErrorMessage : undefined };
  } catch (error) {
    return {
      items: [],
      total: 0,
      error:
        error instanceof ProviderRequestError
          ? error.message
          : "NATO response processing failed.",
      diagnostic: error instanceof ProviderRequestError ? error.diagnostic : undefined,
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
