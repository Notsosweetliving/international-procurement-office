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

test("homepage uses the shared footer and supplies auth-aware Settings state", () => {
  const home = readFileSync("app/page.tsx", "utf8");
  assert.match(home, /<SiteFooter authenticated=\{Boolean\(user\)\} \/>/);
  assert.match(home, /user \? "Open workspace" : "Login \/ Sign up"/);
});

test("language selector is accessible, English-only, and contains no flags", () => {
  const selector = readFileSync("components/language-selector.tsx", "utf8");
  assert.match(selector, /aria-label="Select language"/);
  assert.match(selector, /aria-haspopup="menu"/);
  assert.match(selector, /<Icon name="globe"/);
  assert.match(selector, /English/);
  for (const language of ["French", "German", "Spanish", "Italian", "Portuguese"])
    assert.match(selector, new RegExp(language));
  assert.match(selector, /Coming soon/);
  assert.match(selector, /disabled/);
  assert.doesNotMatch(selector, /🇬🇧|🇫🇷|🇩🇪|🇪🇸|🇮🇹|🇵🇹|flag/i);
});

test("language menu closes for outside pointers, Escape, and current-language selection", () => {
  const selector = readFileSync("components/language-selector.tsx", "utf8");
  assert.match(selector, /document\.addEventListener\("pointerdown", closeOutside\)/);
  assert.match(selector, /document\.removeEventListener\("pointerdown", closeOutside\)/);
  assert.match(selector, /rootRef\.current\?\.contains\(event\.target as Node\)/);
  assert.match(selector, /event\.key === "Escape"/);
  assert.match(selector, /aria-checked="true" onClick=\{\(\) => setOpen\(false\)\}/);
});

test("footer exposes institutional text links and routes Settings by auth state", () => {
  const chrome = readFileSync("components/site-chrome.tsx", "utf8");
  for (const label of ["Contact", "FAQ", "Settings", "Terms", "Privacy Policy"])
    assert.match(chrome, new RegExp(`>${label}<`));
  assert.match(chrome, /authenticated \? "\/settings" : "\/login"/);
  assert.match(chrome, /<nav aria-label="Footer">/);
  assert.doesNotMatch(chrome, /black-button|ghost-button|large-button/);
});

test("required public and account routes exist with substantive policy content", () => {
  for (const route of ["contact", "faq", "terms", "privacy", "(workspace)/settings"])
    assert.doesNotThrow(() => readFileSync(`app/${route}/page.tsx`, "utf8"));
  const terms = readFileSync("app/terms/page.tsx", "utf8");
  const privacy = readFileSync("app/privacy/page.tsx", "utf8");
  for (const heading of ["Acceptance", "Permitted use", "AI-assisted content", "Account termination"])
    assert.match(terms, new RegExp(heading));
  for (const heading of ["Information we handle", "Service providers", "Marketing email choice", "Account deletion"])
    assert.match(privacy, new RegExp(heading));
});

test("opportunity actions share one responsive footprint with padded mobile spacing", () => {
  const card = readFileSync("components/opportunity-card.tsx", "utf8");
  const css = readFileSync("app/v05.css", "utf8");
  assert.match(card, /className="card-actions"/);
  assert.match(card, /className="card-save"/);
  assert.match(css, /\.card-save[\s\S]*min-height: 38px/);
  assert.match(css, /\.card-actions[\s\S]*padding: 18px;/);
  assert.match(css, /\.card-save[\s\S]*flex: 1 1 auto/);
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
