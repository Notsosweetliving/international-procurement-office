import type { OpportunitySource } from "../types";
import type { OpportunityProvider } from "./types";
import { tedOpportunityProvider } from "./ted";
import { natoOpportunityProvider } from "./nato";
import { ukOpportunityProvider } from "./uk";
import { samOpportunityProvider } from "./sam";
export const providerRegistry: Record<
  Exclude<OpportunitySource, "mock">,
  OpportunityProvider
> = {
  TED: tedOpportunityProvider,
  NATO: natoOpportunityProvider,
  UK: ukOpportunityProvider,
  SAM: samOpportunityProvider,
};
export const DEFAULT_SOURCES: Exclude<OpportunitySource, "mock">[] = [
  "TED",
  "NATO",
  "UK",
  "SAM",
];
export function providerForId(id: string) {
  if (id.startsWith("ted-")) return tedOpportunityProvider;
  if (id.startsWith("nato-")) return natoOpportunityProvider;
  if (id.startsWith("uk-")) return ukOpportunityProvider;
  if (id.startsWith("sam-")) return samOpportunityProvider;
  return null;
}
