import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { adminSyncUrl, parseAdminSyncResponse } from "../lib/admin/sync-client.ts";
import { validateIngestionConfig } from "../lib/ingestion/config-validation.ts";

test("admin TED, UK and SAM requests use a valid relative POST URL", () => {
  assert.equal(adminSyncUrl("TED"), "/api/admin/sync-opportunities?source=TED");
  assert.equal(adminSyncUrl("UK"), "/api/admin/sync-opportunities?source=UK");
  assert.equal(adminSyncUrl("SAM"), "/api/admin/sync-opportunities?source=SAM");
  const client = readFileSync("components/ingestion-status-panel.tsx", "utf8");
  assert.match(client, /fetch\(adminSyncUrl\(source\), \{ method: "POST" \}\)/);
  assert.doesNotMatch(client, /new URL\(/);
});

test("source query serialization is encoded safely", () => {
  assert.equal(adminSyncUrl("TED & UK"), "/api/admin/sync-opportunities?source=TED+%26+UK");
});

test("ingestion config rejects missing, blank and malformed Supabase URLs", () => {
  for (const url of [undefined, "", "   ", "not-a-url", "http://example.test"])
    assert.throws(() => validateIngestionConfig(url, "key"), /Supabase URL is invalid or not configured/);
});

test("ingestion config rejects a missing service-role key and trims valid values", () => {
  assert.throws(() => validateIngestionConfig("https://example.supabase.co", "  "), /service-role key/);
  assert.deepEqual(validateIngestionConfig(" https://example.supabase.co ", " key "), { url: "https://example.supabase.co", key: "key" });
});

test("client parses JSON errors and safely falls back for non-JSON errors", async () => {
  const json = await parseAdminSyncResponse(new Response(JSON.stringify({ ok: false, error: "Database unavailable." }), { status: 500, headers: { "content-type": "application/json" } }));
  assert.equal(json.error, "Database unavailable.");
  const text = await parseAdminSyncResponse(new Response("Temporary failure", { status: 502, headers: { "content-type": "text/plain" } }));
  assert.equal(text.error, "Temporary failure");
  const html = await parseAdminSyncResponse(new Response("<html>private debug</html>", { status: 500, headers: { "content-type": "text/html" } }));
  assert.equal(html.error, "Sync failed with HTTP 500.");
});

test("admin route rejects auth and invalid source, returns JSON, and does not require CRON_SECRET", () => {
  const route = readFileSync("app/api/admin/sync-opportunities/route.ts", "utf8");
  assert.match(route, /export async function POST/);
  assert.match(route, /status: 403/);
  assert.match(route, /Unsupported source/);
  assert.match(route, /Response\.json/);
  assert.doesNotMatch(route, /CRON_SECRET|isCronAuthorized/);
  assert.match(route, /ok, \.\.\.result/);
});

test("manual-sync diagnostics cover every safe server stage", () => {
  const route = readFileSync("app/api/admin/sync-opportunities/route.ts", "utf8");
  for (const event of ["admin_sync_started", "admin_sync_authenticated", "admin_sync_source_validated", "admin_sync_ingestion_started", "admin_sync_ingestion_completed", "admin_sync_failed"])
    assert.match(route, new RegExp(event));
});
