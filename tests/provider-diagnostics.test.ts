import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  completeProviderRequest,
  fetchProviderJson,
  providerConfiguration,
  ProviderRequestError,
  safeUpstreamUrl,
} from "../lib/opportunities/diagnostics.ts";
import { canAccessProviderDiagnostics } from "../lib/admin/access.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

test("HTTP 200 records raw and normalized result counts", async () => {
  const { context } = await fetchProviderJson(
    "TED",
    "https://example.test/search",
    {},
    { fetcher: async () => json({ notices: [{ id: 1 }] }), safeError: () => "failed" },
  );
  const diagnostic = await completeProviderRequest(context, 1, 1);
  assert.equal(diagnostic.status, "ok");
  assert.equal(diagnostic.upstreamStatus, 200);
  assert.equal(diagnostic.rawCount, 1);
  assert.equal(diagnostic.normalizedCount, 1);
});

test("HTTP 200 with zero normalized records is a visible normalization failure", async () => {
  const { context } = await fetchProviderJson(
    "UK",
    "https://example.test/releases",
    {},
    { fetcher: async () => json({ releases: [{}] }), safeError: () => "failed" },
  );
  const diagnostic = await completeProviderRequest(context, 1, 0);
  assert.equal(diagnostic.status, "failed");
  assert.equal(diagnostic.errorType, "normalization_failure");
});

for (const status of [403, 429]) {
  test(`HTTP ${status} preserves the upstream status`, async () => {
    await assert.rejects(
      fetchProviderJson("SAM", "https://example.test/search?api_key=secret", {}, {
        fetcher: async () => new Response("", { status }),
        safeError: (value) => `safe ${value}`,
      }),
      (error: unknown) => {
        assert.ok(error instanceof ProviderRequestError);
        assert.equal(error.diagnostic.upstreamStatus, status);
        assert.equal(error.diagnostic.errorType, status === 429 ? "rate_limited" : "http_error");
        assert.doesNotMatch(error.diagnostic.upstreamUrl, /secret/);
        return true;
      },
    );
  });
}

test("timeouts are classified without exposing the thrown error", async () => {
  await assert.rejects(
    fetchProviderJson("TED", "https://example.test/search", {}, {
      fetcher: async () => { throw new DOMException("private detail", "TimeoutError"); },
      safeError: () => "safe failure",
    }),
    (error: unknown) => {
      assert.ok(error instanceof ProviderRequestError);
      assert.equal(error.diagnostic.timeout, true);
      assert.equal(error.diagnostic.errorType, "timeout");
      assert.doesNotMatch(error.diagnostic.safeErrorMessage ?? "", /private/);
      return true;
    },
  );
});

test("malformed JSON is classified safely", async () => {
  await assert.rejects(
    fetchProviderJson("UK", "https://example.test/releases", {}, {
      fetcher: async () => new Response("not-json", { status: 200 }),
      safeError: () => "safe failure",
    }),
    (error: unknown) => {
      assert.ok(error instanceof ProviderRequestError);
      assert.equal(error.diagnostic.errorType, "malformed_json");
      return true;
    },
  );
});

test("configuration status contains booleans only", () => {
  const status = providerConfiguration();
  assert.equal(Object.values(status).every((value) => typeof value === "boolean"), true);
});

test("admin diagnostics require an allowlisted admin and Node runtime", async () => {
  const previous = process.env.ADMIN_EMAILS;
  process.env.ADMIN_EMAILS = "ops@example.com";
  assert.equal(canAccessProviderDiagnostics("ops@example.com"), true);
  assert.equal(canAccessProviderDiagnostics("user@example.com"), false);
  const source = await readFile(new URL("../app/api/admin/provider-check/route.ts", import.meta.url), "utf8");
  assert.match(source, /export const runtime = "nodejs"/);
  assert.match(source, /canAccessProviderDiagnostics\(user\.email\)/);
  if (previous === undefined) delete process.env.ADMIN_EMAILS;
  else process.env.ADMIN_EMAILS = previous;
});

test("safe URLs redact secret query parameters", () => {
  const safe = safeUpstreamUrl("https://example.test/search?api_key=secret&limit=2");
  assert.doesNotMatch(safe, /secret/);
  assert.match(safe, /limit=2/);
});

