import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSamNotice } from "../lib/opportunities/normalize/sam.ts";
import { buildSamSearchParams, formatSamDate, samPostedDateRange, searchSamOpportunitiesWith } from "../lib/opportunities/providers/sam.ts";

const liveShape = {
  noticeId: "abc-123",
  title: "Cybersecurity operations support",
  solicitationNumber: "FAKE-26-001",
  fullParentPathName: "DEPARTMENT OF EXAMPLE.OFFICE OF TECHNOLOGY",
  fullParentPathCode: "001.002",
  postedDate: "2026-08-20",
  reponseDeadLine: "2026-09-30T17:00:00-04:00",
  naicsCode: "541512",
  classificationCode: "D310",
  active: "Yes",
  type: "Solicitation",
  description: "https://sam.gov/api/prod/opps/v3/opportunities/abc-123/resources",
  uiLink: "https://sam.gov/opp/abc-123/view",
  placeOfPerformance: { country: { code: "USA", name: "UNITED STATES" } },
};

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

test("SAM date formatting uses MM/dd/yyyy across month and year boundaries", () => {
  assert.equal(formatSamDate(new Date(2026, 0, 2)), "01/02/2026");
  assert.deepEqual(samPostedDateRange(new Date(2026, 0, 15), 90), { postedFrom: "10/17/2025", postedTo: "01/15/2026" });
  assert.deepEqual(samPostedDateRange(new Date(2026, 2, 1), 1), { postedFrom: "02/28/2026", postedTo: "03/01/2026" });
});

test("SAM date range is capped at one year and mandatory parameters are present", () => {
  const range = samPostedDateRange(new Date(2026, 7, 31), 900);
  assert.deepEqual(range, { postedFrom: "08/31/2025", postedTo: "08/31/2026" });
  const query = buildSamSearchParams({}, new Date(2026, 7, 31));
  assert.equal(query.get("postedFrom"), "06/02/2026");
  assert.equal(query.get("postedTo"), "08/31/2026");
  assert.equal(query.has("api_key"), false);
});

test("SAM title search uses a supported parameter and trims the keyword", () => {
  const query = buildSamSearchParams({ query: "  cybersecurity  ", limit: 5, page: 2 }, new Date(2026, 7, 31));
  assert.equal(query.get("title"), "cybersecurity");
  assert.equal(query.get("offset"), "5");
  assert.equal(query.has("q"), false);
  assert.equal(query.has("ptype"), false);
});

test("SAM API key is trimmed before request construction", async () => {
  let captured = "";
  const result = await searchSamOpportunitiesWith({}, { apiKey: "  secret-test-key  ", now: new Date(2026, 7, 31), fetcher: async input => { captured = input; return jsonResponse({ totalRecords: 0, opportunitiesData: [] }) } });
  assert.equal(new URL(captured).searchParams.get("api_key"), "secret-test-key");
  assert.equal(result.error, undefined);
});

test("missing SAM API key reports a configuration-specific health error", async () => {
  const result = await searchSamOpportunitiesWith({}, { apiKey: "   ", fetcher: async () => { throw new Error("must not fetch") } });
  assert.equal(result.error, "SAM.gov API key is not configured.");
});

for (const [status, message] of [
  [400, "SAM.gov rejected the search parameters."],
  [403, "SAM.gov rejected the API key or API access."],
  [429, "SAM.gov rate limit reached."],
  [500, "SAM.gov is temporarily unavailable."],
] as const) {
  test(`SAM HTTP ${status} maps to a safe provider health message`, async () => {
    const result = await searchSamOpportunitiesWith({}, { apiKey: "test-key", fetcher: async () => new Response("safe upstream message", { status }) });
    assert.equal(result.error, message);
    assert.deepEqual(result.items, []);
  });
}

test("SAM zero results remains a healthy response", async () => {
  const result = await searchSamOpportunitiesWith({ query: "no-such-title" }, { apiKey: "test-key", fetcher: async () => jsonResponse({ totalRecords: 0, opportunitiesData: [] }) });
  assert.equal(result.total, 0);
  assert.equal(result.error, undefined);
});

test("current SAM v2 response shape normalizes records and misspelled deadline", async () => {
  const result = await searchSamOpportunitiesWith({ query: "cybersecurity" }, { apiKey: "test-key", fetcher: async () => jsonResponse({ totalRecords: 1, opportunitiesData: [liveShape] }) });
  assert.equal(result.total, 1);
  assert.equal(result.items[0].title, "Cybersecurity operations support");
  assert.equal(result.items[0].deadline, "2026-09-30T21:00:00.000Z");
  assert.deepEqual(result.items[0].naicsCodes, ["541512"]);
});

test("SAM description URLs are metadata rather than tender summary text", () => {
  const opportunity = normalizeSamNotice(liveShape)!;
  assert.equal(opportunity.descriptionUrl, liveShape.description);
  assert.equal(opportunity.summary, "Description is available from the official SAM.gov notice.");
  const textDescription = normalizeSamNotice({ ...liveShape, description: "Embedded plain-text description" })!;
  assert.equal(textDescription.descriptionUrl, undefined);
  assert.equal(textDescription.summary, "Embedded plain-text description");
});
