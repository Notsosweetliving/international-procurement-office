import type { Opportunity } from "../types.ts";
import { categoryFromText } from "../taxonomy.ts";
import {
  dateOrNull,
  normalizeCountry,
  numberOrNull,
  stableSourceId,
  text,
} from "./common.ts";
type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === "object" ? (v as Obj) : {});
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
export function normalizeUkRelease(raw: unknown): Opportunity | null {
  const r = obj(raw),
    tender = obj(r.tender),
    buyer = obj(r.buyer),
    address = obj(buyer.address),
    period = obj(tender.tenderPeriod),
    value = obj(tender.value),
    classification = obj(tender.classification);
  const reference = text(r.ocid) || text(tender.id) || text(r.id);
  const id = stableSourceId("UK", reference);
  const title = text(tender.title);
  if (!id || !title) return null;
  const cpv = [
    text(classification.id),
    ...arr(tender.additionalClassifications).map((x) => text(obj(x).id)),
  ].filter(Boolean);
  return {
    id,
    reference,
    title,
    buyer: {
      id: text(buyer.id),
      name: text(buyer.name, "UK public authority"),
      type: "Public authority",
      country: normalizeCountry(address.countryName ?? address.country),
    },
    country: normalizeCountry(
      address.countryName ?? address.country,
      "United Kingdom",
    ),
    category: categoryFromText(
      text(classification.description),
      title,
      text(tender.description),
    ),
    value: numberOrNull(value.amount),
    currency: text(value.currency) || null,
    publishedAt: dateOrNull(r.date),
    deadline: dateOrNull(period.endDate),
    eligibility: "Review the official Find a Tender notice",
    summary: text(
      tender.description,
      "Description not disclosed in the available OCDS release.",
    ),
    match: null,
    requirements: [],
    documents: [],
    source: "UK",
    sourceOrganization: "Find a Tender",
    sourceUrl: text(
      r.uri,
      `https://www.find-tender.service.gov.uk/Search/Results`,
    ),
    cpvCodes: cpv,
    procedureType:
      text(tender.procurementMethodDetails) || text(tender.procurementMethod),
  };
}
export function ukOpportunityId(value: string) {
  return stableSourceId("UK", value);
}
