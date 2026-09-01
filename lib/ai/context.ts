import type { CompanyProfile, Opportunity } from "../opportunities/types";
import type { CalculatedMatch } from "../matching/types";
import type { TenderAnalysis } from "./schemas";
export const MAX_TENDER_TEXT = 12000;
export function opportunityContext(o: Opportunity) {
  return JSON.stringify({
    source: o.source,
    reference: o.reference,
    officialTitle: o.title.slice(0, 1000),
    description: o.summary.slice(0, MAX_TENDER_TEXT),
    buyer: o.buyer.name.slice(0, 500),
    buyerCountry: o.buyer.country,
    country: o.country,
    cpv: o.cpvCodes?.slice(0, 20),
    category: o.category,
    publicationDate: o.publishedAt,
    deadline: o.deadline,
    value: o.value,
    currency: o.currency,
    procedureType: o.procedureType,
    officialNotice: o.sourceUrl,
  });
}
export function chatContext(
  o: Opportunity,
  p?: CompanyProfile | null,
  m?: CalculatedMatch | null,
  a?: TenderAnalysis,
  bidDocumentContext?: unknown,
) {
  return JSON.stringify({
    opportunity: JSON.parse(opportunityContext(o)),
    companyProfile: p
      ? {
          name: p.name,
          country: p.country,
          businessModels: p.businessModels,
          capabilities: p.capabilities,
          valueRange: [p.minContractValue, p.maxContractValue],
          currency: p.preferredCurrency,
          regions: p.regions,
          certifications: p.certifications,
          governmentExperience: p.governmentExperience,
        }
      : null,
    deterministicMatch: m,
    aiAnalysis: a ?? null,
    bidWorkspace: bidDocumentContext ?? null,
  }).slice(0, 30000);
}
