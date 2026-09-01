import type { Opportunity } from "../types.ts";
import { categoryFromNaics } from "../taxonomy.ts";
import {
  dateOrNull,
  normalizeCountry,
  numberOrNull,
  stableSourceId,
  text,
} from "./common.ts";

type Obj = Record<string, unknown>;
const obj = (value: unknown): Obj =>
  value && typeof value === "object" ? (value as Obj) : {};
const isHttpUrl = (value: string) => /^https?:\/\//i.test(value);

export function normalizeSamNotice(raw: unknown): Opportunity | null {
  const record = obj(raw),
    data = obj(record.data),
    place = obj(record.placeOfPerformance ?? data.placeOfPerformance),
    country = obj(place.country),
    award = obj(record.award ?? data.award);
  const reference =
    text(record.noticeId) ||
    text(record.solicitationNumber) ||
    text(data.solicitationNumber);
  const id = stableSourceId("SAM", reference),
    title = text(record.title) || text(data.title);
  if (!id || !title) return null;
  const naics = text(record.naicsCode) || text(data.naicsCode),
    psc = text(record.classificationCode) || text(data.classificationCode);
  const organization =
    text(record.fullParentPathName) ||
    text(data.fullParentPathName) ||
    text(record.department, "US Federal agency");
  const description = text(record.description) || text(data.description),
    descriptionUrl = isHttpUrl(description) ? description : undefined;
  const deadline =
    record.responseDeadLine ??
    record.reponseDeadLine ??
    data.responseDeadLine ??
    data.reponseDeadLine;
  return {
    id,
    reference:
      text(record.solicitationNumber) ||
      text(data.solicitationNumber) ||
      reference,
    title,
    buyer: {
      id: text(record.fullParentPathCode) || text(data.fullParentPathCode),
      name: organization,
      type: "US Federal",
      country: "United States",
    },
    country: normalizeCountry(country.name ?? country.code, "United States"),
    category: categoryFromNaics(naics, title),
    value: numberOrNull(award.amount),
    currency: numberOrNull(award.amount) != null ? "USD" : null,
    publishedAt: dateOrNull(record.postedDate ?? data.postedDate),
    deadline: dateOrNull(deadline),
    eligibility:
      "Review the official SAM.gov notice and set-aside requirements",
    summary: descriptionUrl
      ? "Description is available from the official SAM.gov notice."
      : description ||
        "Description is available from the official SAM.gov notice.",
    match: null,
    requirements: [],
    documents: [],
    source: "SAM",
    sourceOrganization: organization,
    sourceUrl:
      text(record.uiLink) ||
      text(record.additionalInfoLink) ||
      text(data.uiLink) ||
      `https://sam.gov/opp/${encodeURIComponent(reference)}/view`,
    descriptionUrl,
    naicsCodes: naics ? [naics] : [],
    pscCodes: psc ? [psc] : [],
    procedureType: text(record.type) || text(data.type),
  };
}

export function samOpportunityId(value: string) {
  return stableSourceId("SAM", value);
}
