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
export function normalizeNatoOpportunity(raw: unknown): Opportunity | null {
  const r = obj(raw);
  const reference = text(r.reference) || text(r.id);
  const id = stableSourceId("NATO", reference);
  const title = text(r.title);
  if (!id || !title) return null;
  return {
    id,
    reference,
    title,
    buyer: {
      id: text(r.organizationCode),
      name: text(r.organization, "NATO Communications and Information Agency"),
      type: "NATO body",
      country: normalizeCountry(r.country, "Belgium"),
    },
    country: normalizeCountry(r.country, "NATO"),
    category: categoryFromText(text(r.category), title, text(r.description)),
    value: numberOrNull(r.estimatedValue),
    currency:
      numberOrNull(r.estimatedValue) != null ? text(r.currency, "EUR") : null,
    publishedAt: dateOrNull(r.publicationDate ?? r.releaseDate),
    deadline: dateOrNull(r.deadline ?? r.closingDate),
    eligibility:
      "NATO jurisdiction and tender-specific eligibility should be reviewed",
    summary: text(
      r.description,
      "Limited source information available. Review the official NCIA documentation.",
    ),
    match: null,
    requirements: [],
    documents: [],
    source: "NATO",
    sourceOrganization: text(r.organization, "NCIA"),
    sourceUrl: text(
      r.sourceUrl,
      "https://www.ncia.nato.int/business/procurement/current-opportunities",
    ),
    procedureType: text(r.procedureType ?? r.method),
  };
}
export function natoOpportunityId(value: string) {
  return stableSourceId("NATO", value);
}
