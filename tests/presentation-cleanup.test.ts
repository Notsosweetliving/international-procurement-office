import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("dashboard omits tuning, supplier coverage and active bids", () => {
  const dashboard = readFileSync("app/(workspace)/dashboard/page.tsx", "utf8");
  for (const removed of ["Tune recommendations", "SUPPLIER COVERAGE", "ACTIVE BIDS", "listSuppliers", "listActiveBidWorkspaces"])
    assert.doesNotMatch(dashboard, new RegExp(removed));
});

test("primary navigation contains exactly the four requested destinations", () => {
  const shell = readFileSync("components/app-shell.tsx", "utf8");
  const navBlock = shell.slice(shell.indexOf("const nav"), shell.indexOf("];", shell.indexOf("const nav")) + 2);
  for (const item of ["Intelligence", "Opportunities", "Saved", "Company"]) assert.match(navBlock, new RegExp(item));
  assert.doesNotMatch(navBlock, /Suppliers|Searches|History|saved-searches/);
  assert.equal((navBlock.match(/^  \[/gm) ?? []).length, 4);
});

test("homepage includes institutional source, workflow and independence language", () => {
  const home = readFileSync("app/page.tsx", "utf8");
  for (const copy of ["GLOBAL PROCUREMENT INTELLIGENCE", "Find the government", "Open workspace", "OFFICIAL PROCUREMENT SOURCES", "EU", "UK Government", "US Federal", "PROCUREMENT INTELLIGENCE", "Discover", "Qualify", "Analyse", "Pursue"])
    assert.match(home.toUpperCase(), new RegExp(copy.toUpperCase()));
  assert.match(home, /not affiliated with or endorsed by any\s+government agency/i);
});

test("mobile navigation is four equal safe-area-aware tap targets", () => {
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /flex: 1 1 25%/);
  assert.match(css, /min-height: 64px/);
  assert.match(css, /white-space: nowrap/);
});
