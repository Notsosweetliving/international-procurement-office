import type { ProcurementSearchIntent } from "./schemas";
export function keywordFallback(query: string): ProcurementSearchIntent {
  return {
    keywords: query
      .replace(/[^\p{L}\p{N}\s-]/gu, " ")
      .split(/\s+/)
      .filter((x) => x.length > 2)
      .slice(0, 6),
  };
}
