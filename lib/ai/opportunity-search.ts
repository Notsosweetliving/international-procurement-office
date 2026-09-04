import type { ProcurementSearchIntent } from "./schemas";
import type { Opportunity } from "@/lib/opportunities/types";

export const AI_CANDIDATE_LIMIT = 200;
export const AI_PREVIEW_LIMIT = 25;

const CATEGORY_GROUPS: Record<string, string[]> = {
  it: ["IT & Communications", "Software", "Networking", "Cybersecurity", "Electronics", "Communications"],
  tech: ["IT & Communications", "Software", "Networking", "Cybersecurity", "Electronics", "Communications"],
  technology: ["IT & Communications", "Software", "Networking", "Cybersecurity", "Electronics", "Communications"],
  healthcare: ["Medical", "Professional Services"],
  health: ["Medical", "Professional Services"],
  transport: ["Vehicles", "Vehicle Parts", "Logistics"],
};

const EUROPE = [
  "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czechia", "Denmark", "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg", "Malta", "Netherlands", "Poland", "Portugal", "Romania", "Slovakia", "Slovenia", "Spain", "Sweden", "United Kingdom",
];

export function expandSearchIntent(intent: ProcurementSearchIntent): ProcurementSearchIntent {
  const categories = new Set<string>();
  for (const category of intent.categories ?? []) {
    const expanded = CATEGORY_GROUPS[category.trim().toLowerCase()];
    for (const value of expanded ?? [category]) categories.add(value);
  }
  const countries = new Set<string>();
  for (const country of intent.countries ?? []) {
    const key = country.trim().toLowerCase();
    if (["europe", "european union", "eu", "europe and uk"].includes(key)) EUROPE.forEach((value) => countries.add(value));
    else if (["uk", "great britain", "britain"].includes(key)) countries.add("United Kingdom");
    else countries.add(country);
  }
  return {
    ...intent,
    categories: categories.size ? [...categories] : undefined,
    countries: countries.size ? [...countries] : undefined,
    currency: intent.currency?.toUpperCase(),
  };
}

export function matchesHardConstraints(opportunity: Opportunity, intent: ProcurementSearchIntent, now = Date.now()) {
  if (intent.minValue != null && (opportunity.value == null || opportunity.value < intent.minValue)) return false;
  if (intent.maxValue != null && (opportunity.value == null || opportunity.value > intent.maxValue)) return false;
  if (intent.currency && opportunity.currency?.toUpperCase() !== intent.currency.toUpperCase()) return false;
  if (intent.closingWithinDays) {
    if (!opportunity.deadline) return false;
    const days = (new Date(opportunity.deadline).getTime() - now) / 86400000;
    if (days < 0 || days > intent.closingWithinDays) return false;
  }
  return true;
}

export function serializeSearchIntent(intent: ProcurementSearchIntent) {
  const params = new URLSearchParams();
  const keywords = intent.keywords?.filter(Boolean).join(" ");
  if (keywords) params.set("q", keywords);
  if (intent.sources?.length === 1) params.set("source", intent.sources[0]);
  if (intent.categories?.length) params.set("categories", intent.categories.join(","));
  if (intent.countries?.length) params.set("countries", intent.countries.join(","));
  if (intent.minValue != null) params.set("minValue", String(intent.minValue));
  if (intent.maxValue != null) params.set("maxValue", String(intent.maxValue));
  if (intent.currency) params.set("currency", intent.currency.toUpperCase());
  if (intent.closingWithinDays) params.set("closingWithinDays", String(intent.closingWithinDays));
  if (intent.sort) params.set("sort", intent.sort);
  return params.toString();
}
