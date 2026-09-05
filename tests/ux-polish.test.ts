import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("institutional chrome uses a globe, support links and careful independence language", () => {
  const chrome = readFileSync("components/site-chrome.tsx", "utf8");
  assert.match(chrome, /name="globe"/);
  assert.match(chrome, /An official website of the International Procurement Office/);
  for (const path of ["/contact", "/faq", "/privacy", "/terms", "/settings"])
    assert.match(chrome, new RegExp(path));
  assert.doesNotMatch(chrome, /🇺🇸|🇬🇧|🇪🇺/);
});

test("marketing consent defaults off and records a timestamp only after opt-in", () => {
  const migration = readFileSync("supabase/migrations/202609050001_marketing_consent.sql", "utf8");
  const signup = readFileSync("components/auth-form.tsx", "utf8");
  const settings = readFileSync("app/settings-actions.ts", "utf8");
  assert.match(migration, /marketing_opt_in boolean not null default false/);
  assert.match(migration, /case when opted_in then now\(\) else null end/);
  assert.match(signup, /type="checkbox"/);
  assert.doesNotMatch(signup, /defaultChecked/);
  assert.match(settings, /optedIn \? new Date\(\)\.toISOString\(\) : null/);
});

test("customer directory remains server-side behind the admin route", () => {
  const admin = readFileSync("app/admin/page.tsx", "utf8");
  const directory = readFileSync("lib/admin/customer-directory.ts", "utf8");
  assert.match(admin, /if \(!user \|\| !matchesAdminList\) notFound\(\)/);
  assert.match(directory, /db\.auth\.admin\.listUsers/);
  assert.match(directory, /last_sign_in_at/);
  assert.match(directory, /marketing_opt_in/);
});
