import nextEnv from "@next/env";
import { buildSamSearchParams } from "../lib/opportunities/providers/sam.ts";

nextEnv.loadEnvConfig(process.cwd());
const apiKey = (process.env.SAM_API_KEY ?? "").trim();
if (!apiKey) {
  console.error("SAM.gov API key is not configured.");
  process.exitCode = 1;
} else {
  const base = (process.env.SAM_API_BASE_URL ?? "https://api.sam.gov/opportunities/v2").replace(/\/$/, "");
  const searches = process.argv.slice(2);
  for (const keyword of searches.length ? searches : [""]) {
    const query = buildSamSearchParams({ query: keyword || undefined, limit: 5 }, new Date(), 30);
    query.set("api_key", apiKey);
    const response = await fetch(`${base}/search?${query.toString()}`, { headers: { accept: "application/json" } });
    console.log(`Search: ${keyword || "recent opportunities"}`);
    console.log(`HTTP status: ${response.status}`);
    const data = await response.json().catch(() => ({})) as Record<string, unknown>;
    const records = Array.isArray(data.opportunitiesData) ? data.opportunitiesData as Record<string, unknown>[] : [];
    console.log(`totalRecords: ${typeof data.totalRecords === "number" ? data.totalRecords : 0}`);
    for (const record of records.slice(0, 5)) console.log(`- ${String(record.title ?? "Untitled")} | ${String(record.solicitationNumber ?? "No solicitation number")}`);
    if (!response.ok) process.exitCode = 1;
  }
}
