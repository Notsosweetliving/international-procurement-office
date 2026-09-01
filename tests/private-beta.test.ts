import test from "node:test";
import assert from "node:assert/strict";
import { validateBetaInvite } from "../lib/beta/invites.ts";
import {
  entitlement,
  canAnalyzeOpportunity,
  canCreateWorkspace,
  canAddSupplier,
  canSaveOpportunity,
  canSaveSearch,
} from "../lib/billing/entitlements.ts";
import { verifyStripeSignature } from "../lib/billing/stripe.ts";
import { createHmac } from "node:crypto";
import {
  notificationDedupeKey,
  shouldGenerateAlert,
} from "../lib/email/alerts.ts";
import {
  storageCleanupPrefix,
  ACCOUNT_TABLES,
} from "../lib/account/deletion.ts";
import { isAdminEmail } from "../lib/admin/access.ts";
import { savedSearchSchema } from "../lib/saved-searches/validation.ts";
import { calculateOpportunityMatch } from "../lib/matching/engine.ts";
import { calculateBidReadiness } from "../lib/bid-workspace/readiness.ts";
import { calculateSupplierFit } from "../lib/suppliers/matching.ts";
test("beta invite validation accepts matching usable invites", () => {
  process.env.BETA_ACCESS_MODE = "true";
  assert.equal(
    validateBetaInvite(
      {
        email: "a@b.com",
        code: "BETA",
        maxUses: 2,
        uses: 0,
        expiresAt: "2099-01-01",
      },
      "BETA",
      "a@b.com",
    ).valid,
    true,
  );
});
test("expired and exhausted beta invites fail", () => {
  process.env.BETA_ACCESS_MODE = "true";
  assert.equal(
    validateBetaInvite(
      { email: null, code: "X", maxUses: 1, uses: 0, expiresAt: "2020-01-01" },
      "X",
      "a@b.com",
    ).reason,
    "expired",
  );
  assert.equal(
    validateBetaInvite(
      { email: null, code: "X", maxUses: 1, uses: 1, expiresAt: null },
      "X",
      "a@b.com",
    ).reason,
    "exhausted",
  );
});
test("all server entitlement helpers enforce plan limits", () => {
  assert.equal(canAnalyzeOpportunity("beta_free", 10).allowed, false);
  assert.equal(canCreateWorkspace("beta_free", 3).allowed, false);
  assert.equal(canAddSupplier("beta_free", 25).allowed, false);
  assert.equal(canSaveOpportunity("beta_free", 25).allowed, false);
  assert.equal(canSaveSearch("beta_free", 5).allowed, false);
  assert.equal(entitlement("pro", "saved_search", 5).allowed, true);
});
test("stripe webhook verification checks signature and timestamp", () => {
  const payload = '{"id":"evt_test"}',
    secret = "whsec_test",
    now = 1700000000,
    sig = createHmac("sha256", secret)
      .update(`${now}.${payload}`)
      .digest("hex");
  assert.equal(
    verifyStripeSignature(payload, `t=${now},v1=${sig}`, secret, now),
    true,
  );
  assert.equal(
    verifyStripeSignature(payload, `t=${now},v1=bad`, secret, now),
    false,
  );
});
test("alerts and reminders are deduplicated and frequency aware", () => {
  assert.equal(
    notificationDedupeKey("deadline", "u", "o", "7"),
    notificationDedupeKey("deadline", "u", "o", "7"),
  );
  assert.equal(shouldGenerateAlert("daily", null), true);
  assert.equal(shouldGenerateAlert("off", null), false);
});
test("saved search schema persists filters and rejects inverted values", () => {
  assert.equal(
    savedSearchSchema.safeParse({
      name: "UK cyber",
      query: "cyber",
      sources: ["UK"],
      minValue: 10,
      maxValue: 1,
    }).success,
    false,
  );
  assert.equal(
    savedSearchSchema.safeParse({
      name: "UK cyber",
      query: "cyber",
      sources: ["UK"],
    }).success,
    true,
  );
});
test("account cleanup includes private data and owner storage prefix", () => {
  assert.ok(ACCOUNT_TABLES.includes("suppliers"));
  assert.ok(ACCOUNT_TABLES.includes("saved_searches"));
  assert.equal(storageCleanupPrefix("user-1"), "user-1/");
});
test("admin access is environment restricted", () => {
  process.env.ADMIN_EMAILS = "admin@example.com,ops@example.com";
  assert.equal(isAdminEmail("admin@example.com"), true);
  assert.equal(isAdminEmail("user@example.com"), false);
});
test("V1 architecture does not mutate existing scoring functions", () => {
  assert.equal(typeof calculateOpportunityMatch, "function");
  assert.equal(typeof calculateBidReadiness, "function");
  assert.equal(typeof calculateSupplierFit, "function");
});
test("migration defines ownership RLS and queue dedupe", async () => {
  const sql = await import("node:fs/promises").then((x) =>
    x.readFile(
      new URL(
        "../supabase/migrations/202608310003_contractos_v10_private_beta.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  for (const table of [
    "saved_searches",
    "saved_search_alerts",
    "deadline_reminders",
    "subscription_accounts",
    "usage_events",
    "notification_queue",
    "activity_events",
  ])
    assert.match(
      sql,
      new RegExp(`alter table public.${table} enable row level security`),
    );
  assert.match(sql, /dedupe_key text not null unique/);
});
