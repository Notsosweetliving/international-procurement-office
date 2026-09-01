import type { SupplierRecord } from "./types.ts";
export function websiteDomain(value: string | null | undefined) {
  if (!value) return "";
  try {
    return new URL(
      /^https?:\/\//i.test(value) ? value : `https://${value}`,
    ).hostname
      .replace(/^www\./, "")
      .toLowerCase();
  } catch {
    return "";
  }
}
export function possibleSupplierDuplicate(
  existing: Pick<SupplierRecord, "id" | "name" | "country" | "website">[],
  candidate: { name: string; country: string; website?: string | null },
) {
  const domain = websiteDomain(candidate.website);
  return (
    existing.find(
      (x) =>
        (domain && websiteDomain(x.website) === domain) ||
        (x.name.trim().toLowerCase() === candidate.name.trim().toLowerCase() &&
          x.country.trim().toLowerCase() ===
            candidate.country.trim().toLowerCase()),
    ) ?? null
  );
}
