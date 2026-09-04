import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { expandSearchIntent, matchesHardConstraints, serializeSearchIntent } from "../lib/ai/opportunity-search.ts";
import { keywordFallback } from "../lib/ai/search-fallback.ts";
import type { Opportunity } from "../lib/opportunities/types.ts";

const opportunity = (changes: Partial<Opportunity> = {}): Opportunity => ({
  id: "one", reference: "one", title: "Network equipment", buyer: { id: "buyer", name: "Buyer", type: "Public", country: "Belgium" }, country: "Belgium", category: "Networking", value: 750_000, currency: "EUR", publishedAt: "2026-08-01", deadline: "2026-10-01", eligibility: "See notice", summary: "Networking", match: null, requirements: [], documents: [], source: "TED", ...changes,
});

test("fallback parses IT, Europe and 500k-1M without fabricating currency", () => {
  const parsed = expandSearchIntent(keywordFallback("Show IT contracts between 500k and 1M in Europe"));
  assert.deepEqual(parsed.categories, ["IT & Communications", "Software", "Networking", "Cybersecurity", "Electronics", "Communications"]);
  assert.ok(parsed.countries?.includes("Belgium"));
  assert.ok(parsed.countries?.includes("United Kingdom"));
  assert.equal(parsed.minValue, 500_000);
  assert.equal(parsed.maxValue, 1_000_000);
  assert.equal(parsed.currency, undefined);
});

test("explicit currency is hard while unknown currency permits disclosed currencies", () => {
  assert.equal(matchesHardConstraints(opportunity({ currency: "GBP" }), { minValue: 500_000, maxValue: 1_000_000 }), true);
  assert.equal(matchesHardConstraints(opportunity({ currency: "GBP" }), { currency: "EUR", maxValue: 1_000_000 }), false);
  assert.equal(matchesHardConstraints(opportunity({ value: null }), { maxValue: 1_000_000 }), false);
  assert.equal(matchesHardConstraints(opportunity({ value: 5_000_000 }), { maxValue: 1_000_000 }), false);
});

test("view-all serialization preserves structured hard filters", () => {
  const query = new URLSearchParams(serializeSearchIntent({ keywords: ["network"], categories: ["Networking"], countries: ["United Kingdom"], minValue: 500_000, maxValue: 1_000_000, currency: "gbp", sort: "best_match" }));
  assert.equal(query.get("q"), "network");
  assert.equal(query.get("categories"), "Networking");
  assert.equal(query.get("countries"), "United Kingdom");
  assert.equal(query.get("currency"), "GBP");
  assert.equal(query.get("maxValue"), "1000000");
});

test("AI search uses 200 candidates, one conservative fallback and at most 25 previews", () => {
  const route = readFileSync("app/api/ai/search/route.ts", "utf8");
  const helper = readFileSync("lib/ai/opportunity-search.ts", "utf8");
  assert.match(helper, /AI_CANDIDATE_LIMIT = 200/);
  assert.match(helper, /AI_PREVIEW_LIMIT = 25/);
  assert.match(route, /searchCachedOpportunities\(client, queryParams\)/);
  assert.match(route, /query: undefined/);
  assert.match(route, /matchesHardConstraints/);
});

test("opportunities start at 50, load to 100, and dashboard ranks a 200-record pool to top 10", () => {
  const opportunities = readFileSync("app/(workspace)/opportunities/page.tsx", "utf8");
  const dashboard = readFileSync("app/(workspace)/dashboard/page.tsx", "utf8");
  const list = readFileSync("components/matched-opportunity-list.tsx", "utf8");
  assert.match(opportunities, /Math\.max\(50/);
  assert.match(opportunities, /Load more opportunities/);
  assert.match(opportunities, /Math\.min\(100, visible \+ 50\)/);
  assert.match(dashboard, /limit: 200/);
  assert.match(list, /list\.slice\(0, 10\)/);
});

test("presentation polish is auth-aware, centered and emoji-free", () => {
  const home = readFileSync("app/page.tsx", "utf8");
  const auth = readFileSync("app/v05.css", "utf8");
  const detail = readFileSync("app/(workspace)/opportunities/[id]/page.tsx", "utf8");
  assert.match(home, /user \? "Open workspace" : "Login \/ Sign up"/);
  assert.match(auth, /\.auth-identity[\s\S]*justify-items: center/);
  assert.match(detail, /Open official notice/);
  assert.doesNotMatch(detail, /↗|emoji/);
});
