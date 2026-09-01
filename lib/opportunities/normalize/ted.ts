import type { Opportunity } from "../types";
type Raw = Record<string, unknown>;
const COUNTRIES: Record<string, string> = {
  AUT: "Austria",
  BEL: "Belgium",
  BGR: "Bulgaria",
  HRV: "Croatia",
  CYP: "Cyprus",
  CZE: "Czechia",
  DNK: "Denmark",
  EST: "Estonia",
  FIN: "Finland",
  FRA: "France",
  DEU: "Germany",
  GRC: "Greece",
  HUN: "Hungary",
  IRL: "Ireland",
  ITA: "Italy",
  LVA: "Latvia",
  LTU: "Lithuania",
  LUX: "Luxembourg",
  MLT: "Malta",
  NLD: "Netherlands",
  POL: "Poland",
  PRT: "Portugal",
  ROU: "Romania",
  SVK: "Slovakia",
  SVN: "Slovenia",
  ESP: "Spain",
  SWE: "Sweden",
};
const first = (v: unknown): unknown => (Array.isArray(v) ? v[0] : v);
const strip = (v: string) =>
  v
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const text = (v: unknown): string | null => {
  v = first(v);
  if (typeof v === "string" && v.trim()) return strip(v);
  if (v && typeof v === "object") {
    const o = v as Raw;
    for (const k of ["eng", "ENG", "en", "EN"])
      if (typeof o[k] === "string") return strip(o[k] as string);
    for (const x of Object.values(o)) {
      const found = text(x);
      if (found) return found;
    }
  }
  return null;
};
const number = (v: unknown): number | null => {
  v = first(v);
  const n =
    typeof v === "number"
      ? v
      : typeof v === "string"
        ? Number(v.replace(/,/g, ""))
        : NaN;
  return Number.isFinite(n) ? n : null;
};
const strings = (v: unknown): string[] =>
  Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string")
    : typeof v === "string"
      ? [v]
      : [];
const link = (v: unknown): string | undefined => {
  if (!v || typeof v !== "object") return;
  const links = v as Raw;
  for (const group of ["html", "htmlDirect"]) {
    const g = links[group];
    if (g && typeof g === "object") {
      const o = g as Raw;
      const c = o.ENG ?? o.eng ?? Object.values(o)[0];
      if (typeof c === "string" && c.startsWith("https://ted.europa.eu/"))
        return c;
    }
  }
};
export function tedOpportunityId(noticeId: string) {
  return (
    "ted-" +
    noticeId
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
  );
}
export function cpvCategory(cpv: string | undefined) {
  const p = cpv?.slice(0, 2);
  if (!p) return "Other";
  if (p === "48") return "Software";
  if (["30", "32", "72", "73"].includes(p)) return "IT & Communications";
  if (p === "45") return "Construction";
  if (p === "34") return "Vehicles";
  if (p === "33") return "Medical";
  if (p === "18") return "Clothing";
  if (["60", "63", "64"].includes(p)) return "Logistics";
  if (p === "31") return "Electronics";
  if (p === "79") return "Professional Services";
  return "Other";
}
export function normalizeTedNotice(value: unknown): Opportunity | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Raw;
  const reference = text(raw["publication-number"]);
  if (!reference) return null;
  const buyerCountry = text(raw["buyer-country"]);
  const countryCode =
    text(raw["place-of-performance-country-proc"]) ?? buyerCountry;
  const cpv = strings(raw["classification-cpv"]);
  return {
    id: tedOpportunityId(reference),
    reference,
    title: text(raw["notice-title"]) ?? "Untitled procurement notice",
    buyer: {
      id: `ted-buyer-${reference}`,
      name: text(raw["buyer-name"]) ?? "Contracting authority not disclosed",
      type: "Public contracting authority",
      country: COUNTRIES[buyerCountry ?? ""] ?? buyerCountry ?? "Not disclosed",
    },
    country: COUNTRIES[countryCode ?? ""] ?? countryCode ?? "Not disclosed",
    category: cpvCategory(cpv[0]),
    value: number(raw["estimated-value-proc"]),
    currency: text(raw["estimated-value-cur-proc"]),
    publishedAt: text(raw["publication-date"]),
    deadline:
      text(raw.deadline) ?? text(raw["deadline-receipt-tender-date-lot"]),
    eligibility: "See official notice",
    summary:
      text(raw["description-proc"]) ??
      text(raw["description-lot"]) ??
      "No description was supplied in the searchable TED fields. Review the official notice for full details.",
    match: null,
    requirements: [],
    documents: [],
    source: "TED",
    sourceUrl:
      link(raw.links) ??
      `https://ted.europa.eu/en/notice/-/detail/${encodeURIComponent(reference)}`,
    cpvCodes: cpv,
    procedureType: text(raw["procedure-type"]) ?? undefined,
  };
}
