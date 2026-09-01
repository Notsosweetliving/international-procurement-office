const COUNTRIES: Record<string, string> = {
  GB: "United Kingdom",
  GBR: "United Kingdom",
  UK: "United Kingdom",
  "UNITED KINGDOM": "United Kingdom",
  US: "United States",
  USA: "United States",
  "UNITED STATES": "United States",
  BE: "Belgium",
  BEL: "Belgium",
  DE: "Germany",
  DEU: "Germany",
  FR: "France",
  FRA: "France",
  NL: "Netherlands",
  NLD: "Netherlands",
  ES: "Spain",
  ESP: "Spain",
  IT: "Italy",
  ITA: "Italy",
  EU: "European Union",
};
export function normalizeCountry(value: unknown, fallback = "Not disclosed") {
  if (typeof value !== "string" || !value.trim()) return fallback;
  const clean = value.trim();
  return (
    COUNTRIES[clean.toUpperCase()] ??
    clean.replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
export function stableSourceId(source: "NATO" | "UK" | "SAM", value: unknown) {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 140);
  return raw ? `${source.toLowerCase()}-${raw}` : null;
}
export function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}
export function numberOrNull(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}
export function dateOrNull(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
export function sourceFromOpportunityId(id: string) {
  return id.startsWith("ted-")
    ? "TED"
    : id.startsWith("nato-")
      ? "NATO"
      : id.startsWith("uk-")
        ? "UK"
        : id.startsWith("sam-")
          ? "SAM"
          : null;
}
export function selectOpportunitySources(values?: string[]) {
  const allowed = ["TED", "NATO", "UK", "SAM"] as const;
  if (!values?.length) return [...allowed];
  return [
    ...new Set(
      values.filter((value): value is (typeof allowed)[number] =>
        allowed.includes(value as (typeof allowed)[number]),
      ),
    ),
  ];
}
