import type { ProcurementSearchIntent } from "./schemas";
export function keywordFallback(query: string): ProcurementSearchIntent {
  const lower = query.toLowerCase();
  const categories = ["it", "tech", "healthcare", "transport", "software", "networking", "cybersecurity"]
    .filter((term) => new RegExp(`\\b${term}\\b`, "i").test(query));
  const countries = /\b(europe|eu|european union)\b/i.test(query)
    ? ["European Union"]
    : /\b(uk|united kingdom|britain)\b/i.test(query)
      ? ["United Kingdom"]
      : undefined;
  const currency = query.includes("£") ? "GBP" : query.includes("€") ? "EUR" : query.includes("$") ? "USD" : undefined;
  const amounts = [...lower.matchAll(/(?:£|€|\$)?\s*(\d+(?:\.\d+)?)\s*(k|m|million|thousand)?\b/g)]
    .map((match) => Number(match[1]) * (["m", "million"].includes(match[2] ?? "") ? 1_000_000 : ["k", "thousand"].includes(match[2] ?? "") ? 1_000 : 1))
    .filter((amount) => amount >= 1_000);
  const between = /\bbetween\b/i.test(query) && amounts.length >= 2;
  const under = /\b(under|below|less than|up to)\b/i.test(query);
  const over = /\b(over|above|more than|at least)\b/i.test(query);
  const stopWords = new Set(["show", "find", "contracts", "contract", "opportunities", "opportunity", "between", "under", "over", "below", "above", "than", "and", "the", "in", "for"]);
  return {
    keywords: query
      .replace(/[^\p{L}\p{N}\s-]/gu, " ")
      .split(/\s+/)
      .filter((x) => x.length > 2 && !stopWords.has(x.toLowerCase()))
      .slice(0, 8),
    categories: categories.length ? categories : undefined,
    countries,
    minValue: between ? Math.min(amounts[0], amounts[1]) : over ? amounts[0] : undefined,
    maxValue: between ? Math.max(amounts[0], amounts[1]) : under ? amounts[0] : undefined,
    currency,
  };
}
