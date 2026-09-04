import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { cacheRowToOpportunity, freshnessLabel, opportunityToCacheRow } from "../lib/opportunities/cache.ts";
import { isCronAuthorized } from "../lib/ingestion/authorization.ts";
import { buildSamSearchParams } from "../lib/opportunities/providers/sam.ts";
import { calculateOpportunityMatch } from "../lib/matching/engine.ts";
import { MOCK_COMPANY, MOCK_OPPORTUNITIES } from "../lib/opportunities/mock-data.ts";

const migration = readFileSync("supabase/migrations/202609040001_procurement_cache.sql", "utf8");
test("cache migration enforces source identity uniqueness and service-only writes", () => {
  assert.match(migration, /unique \(source, source_opportunity_id\)/i);
  assert.match(migration, /revoke insert, update, delete.*authenticated/i);
  assert.match(migration, /using gin \(search_vector\)/i);
});
test("cache mapping preserves IDs and AI/save/workspace-compatible fields", () => {
  const original = { ...MOCK_OPPORTUNITIES[0], source: "TED" as const };
  const inserted = opportunityToCacheRow(original, new Date("2026-01-01T00:00:00Z"));
  const roundTrip = cacheRowToOpportunity({ id: "db-id", first_seen_at: "2026-01-01T00:00:00Z", created_at: "2026-01-01T00:00:00Z", search_vector: null, ...inserted });
  assert.equal(roundTrip.id, original.id);
  assert.equal(roundTrip.reference, original.reference);
  assert.equal(roundTrip.source, "TED");
  assert.equal(roundTrip.title, original.title);
});
test("full-text and source filters map to database queries", () => {
  const source = readFileSync("lib/opportunities/cache.ts", "utf8");
  assert.match(source, /textSearch\("search_vector"/);
  assert.match(source, /\.in\("source"/);
  assert.match(source, /\.in\("procurement_country"/);
});
test("source freshness is quiet and human readable", () => {
  const realNow = Date.now;
  Date.now = () => new Date("2026-01-02T12:00:00Z").getTime();
  try { assert.equal(freshnessLabel([{ source: "SAM", last_success_at: "2026-01-01T18:00:00Z" } as never], "SAM"), "Updated 18 hours ago"); }
  finally { Date.now = realNow; }
});
test("cron authentication fails closed and accepts only the bearer secret", () => {
  assert.equal(isCronAuthorized(new Request("https://example.test"), "secret"), false);
  assert.equal(isCronAuthorized(new Request("https://example.test", { headers: { authorization: "Bearer wrong" } }), "secret"), false);
  assert.equal(isCronAuthorized(new Request("https://example.test", { headers: { authorization: "Bearer secret" } }), "secret"), true);
  assert.equal(isCronAuthorized(new Request("https://example.test", { headers: { authorization: "Bearer secret" } }), ""), false);
});
test("SAM ingestion lookback is configurable without exposing its key", () => {
  const params = buildSamSearchParams({ limit: 100 }, new Date("2026-01-31T12:00:00"), 7);
  assert.equal(params.get("postedFrom"), "01/24/2026");
  assert.equal(params.has("api_key"), false);
});
test("ordinary UX omits NATO as a live filter and removes provider error walls", () => {
  const page = readFileSync("app/(workspace)/opportunities/page.tsx", "utf8");
  assert.match(page, /NATO — coming soon/);
  assert.doesNotMatch(page, /provider-warning/);
  assert.match(page, /No matching opportunities found/);
});
test("dashboard reads cache and deterministic Match Score is unchanged", () => {
  const dashboard = readFileSync("app/(workspace)/dashboard/page.tsx", "utf8");
  assert.match(dashboard, /searchCachedOpportunities/);
  const before = calculateOpportunityMatch(MOCK_COMPANY, MOCK_OPPORTUNITIES[0]);
  const after = calculateOpportunityMatch(MOCK_COMPANY, cacheRowToOpportunity({ id: "x", first_seen_at: "2026-01-01Z", created_at: "2026-01-01Z", search_vector: null, ...opportunityToCacheRow(MOCK_OPPORTUNITIES[0]) }));
  assert.equal(after.score, before.score);
});
test("manual sync is admin protected and SAM 429 path stops before upsert", () => {
  const route = readFileSync("app/api/admin/sync-opportunities/route.ts", "utf8");
  const sync = readFileSync("lib/ingestion/sync-provider.ts", "utf8");
  assert.match(route, /canAccessProviderDiagnostics/);
  assert.match(route, /status: 403/);
  const rateLimitBlock = sync.slice(sync.indexOf("if (rateLimited)"), sync.indexOf("if (result.error"));
  assert.match(rateLimitBlock, /return \{ source, status: "rate_limited"/);
  assert.doesNotMatch(rateLimitBlock, /upsertOpportunities/);
  assert.match(rateLimitBlock, /is_stale: true/);
});
