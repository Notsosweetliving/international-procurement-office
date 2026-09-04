import type { ComplianceStatus } from "./types";

export function simpleRequirementStatus(status: ComplianceStatus) {
  if (status === "meets" || status === "likely_meets" || status === "not_applicable") return "Ready";
  if (status === "needs_evidence") return "Need evidence";
  if (status === "missing") return "Missing";
  return "Review";
}

export function nextBidActions(input: { documents: number; requirements: number; missing: string[]; checklistOpen: string[] }) {
  const actions: string[] = [];
  if (!input.documents) actions.push("Upload the tender specification");
  if (!input.requirements) actions.push("Analyze the tender documents to identify requirements");
  actions.push(...input.missing.slice(0, 2).map((title) => `Add proof for ${title}`));
  actions.push(...input.checklistOpen.slice(0, 2));
  return [...new Set(actions)].slice(0, 4);
}
