import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { safeAiError } from "../lib/ai/errors.ts";
import { nextBidActions, simpleRequirementStatus } from "../lib/bid-workspace/presentation.ts";
import { validateTenderFile } from "../lib/documents/validation.ts";

test("AI failures classify 401, 429, timeout and invalid structured output", () => {
  assert.deepEqual(safeAiError(Object.assign(new Error("unauthorized"), { status: 401 })), { type: "unauthorized", message: "OpenAI rejected the configured credentials.", status: 401 });
  assert.equal(safeAiError(Object.assign(new Error("quota"), { status: 429 })).type, "rate_limited");
  assert.equal(safeAiError(new DOMException("timed out", "AbortError")).type, "timeout");
  assert.equal(safeAiError(new Error("The AI response could not be validated.")).type, "invalid_structured_output");
});

test("analysis uses cached opportunities, reuses persisted results, and returns valid output on persistence failure", () => {
  const route = readFileSync("app/api/ai/analyze/route.ts", "utf8");
  assert.match(route, /getCachedOpportunity/);
  assert.doesNotMatch(route, /opportunityService/);
  assert.match(route, /if \(persisted\)/);
  assert.match(route, /warning: "Analysis is ready, but could not be saved for later\."/);
  for (const stage of ["analysis_started", "analysis_authenticated", "analysis_opportunity_loaded", "analysis_cached_result_checked", "analysis_openai_started", "analysis_openai_completed", "analysis_validation_completed", "analysis_persisted", "analysis_failed"]) assert.match(route, new RegExp(stage));
});

test("OpenAI configuration trims values and has a non-empty default model", () => {
  const client = readFileSync("lib/ai/client.ts", "utf8");
  assert.match(client, /OPENAI_MODEL\?\.trim\(\) \|\| "gpt-5-mini"/);
  assert.match(client, /AI analysis is not configured/);
});

test("document upload uses cache and distinguishes bucket, row, extraction and RLS-style storage failures", () => {
  const upload = readFileSync("app/api/bid-workspaces/[id]/documents/route.ts", "utf8");
  assert.match(upload, /getCachedOpportunity/);
  assert.doesNotMatch(upload, /opportunityService/);
  for (const state of ["storage_bucket_missing", "storage_upload_rejected", "document_row_persistence", "no_extractable_text", "extraction_failed"]) assert.match(upload, new RegExp(state));
  assert.match(upload, /tender_document_extractions/);
});

test("file validation retains 20MB and PDF, DOCX and TXT rules", () => {
  const tooLarge = validateTenderFile("a.pdf", 20 * 1024 * 1024 + 1, "application/pdf", new TextEncoder().encode("%PDF-"));
  const unsupported = validateTenderFile("a.exe", 10, "application/octet-stream", new Uint8Array(10));
  assert.equal(tooLarge.ok, false);
  assert.match(tooLarge.ok ? "" : tooLarge.error, /20MB/);
  assert.equal(unsupported.ok, false);
  assert.match(unsupported.ok ? "" : unsupported.error, /PDF, DOCX and TXT/);
});

test("workspace exposes four simple sections, onboarding, summaries and mobile cards", () => {
  const component = readFileSync("components/bid-workspace.tsx", "utf8");
  const css = readFileSync("app/v07.css", "utf8");
  assert.match(component, /\["Overview", "Documents", "Requirements", "Readiness"\]/);
  assert.doesNotMatch(component, /"Compliance", "Risks", "Submission checklist"/);
  for (const copy of ["START YOUR BID REVIEW", "NEXT BEST ACTIONS", "BID READINESS", "Proof / document", "Need evidence", "Do not pursue"]) assert.match(component, new RegExp(copy));
  assert.match(css, /@media \(max-width: 767px\)[\s\S]*\.requirement-cards dl \{ grid-template-columns: 1fr/);
});

test("requirement labels and next actions are deterministic", () => {
  assert.equal(simpleRequirementStatus("meets"), "Ready");
  assert.equal(simpleRequirementStatus("needs_evidence"), "Need evidence");
  assert.equal(simpleRequirementStatus("missing"), "Missing");
  const actions = nextBidActions({ documents: 0, requirements: 0, missing: ["ISO 9001"], checklistOpen: ["Complete pricing schedule"] });
  assert.deepEqual(actions, ["Upload the tender specification", "Analyze the tender documents to identify requirements", "Add proof for ISO 9001", "Complete pricing schedule"]);
});

test("document cards support view, analyze and remove", () => {
  const component = readFileSync("components/bid-workspace.tsx", "utf8");
  const route = readFileSync("app/api/bid-workspaces/[id]/documents/[documentId]/route.ts", "utf8");
  for (const action of [">View<", ">Analyze<", ">Remove<"]) assert.match(component, new RegExp(action));
  assert.match(route, /export async function DELETE/);
});
