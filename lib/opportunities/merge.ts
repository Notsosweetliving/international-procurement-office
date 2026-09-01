import type { Opportunity } from "./types";
const key = (o: Opportunity) =>
  [o.title, o.buyer.name, o.deadline ?? ""]
    .map((x) => x.toLowerCase().replace(/[^a-z0-9]/g, ""))
    .join("|");
export function mergeConservative(items: Opportunity[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const k = key(item);
    if (!item.deadline || !item.buyer.name || seen.has(k)) return !seen.has(k);
    seen.add(k);
    return true;
  });
}
export function sortOpportunities(
  items: Opportunity[],
  sort: "newest" | "closing_soon" | "highest_value" = "newest",
) {
  const copy = [...items];
  if (sort === "closing_soon")
    copy.sort(
      (a, b) =>
        new Date(a.deadline ?? "9999").getTime() -
        new Date(b.deadline ?? "9999").getTime(),
    );
  else if (sort === "highest_value")
    copy.sort((a, b) => (b.value ?? -1) - (a.value ?? -1));
  else
    copy.sort(
      (a, b) =>
        new Date(b.publishedAt ?? 0).getTime() -
        new Date(a.publishedAt ?? 0).getTime(),
    );
  return copy;
}
