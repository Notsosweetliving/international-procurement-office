import type { Opportunity } from "../opportunities/types.ts";
import type { SourcingNeed, SupplierType } from "./types.ts";
const CONTROLLED =
  /\b(weapon|ammunition|explosive|missile|firearm|munition|ordnance)\b/i;
const CAPABILITIES: [RegExp, string, "product" | "service" | "logistics"][] = [
  [/cyber|security software/i, "Cybersecurity", "service"],
  [/software|saas|application/i, "Software", "service"],
  [/network|router|switch|communications?/i, "Networking", "product"],
  [/computer|laptop|notebook|hardware|server/i, "IT hardware", "product"],
  [/logistics|freight|transport/i, "Logistics", "logistics"],
  [/vehicle|automotive|parts/i, "Vehicles and vehicle parts", "product"],
  [/medical|hospital|clinical/i, "Medical supplies", "product"],
  [/construction|works|building/i, "Construction", "service"],
  [/uniform|clothing|textile/i, "Clothing and uniforms", "product"],
  [/office|furniture|printer/i, "Office equipment", "product"],
  [/consult|professional service/i, "Professional services", "service"],
];
export function isControlledSourcing(text: string) {
  return CONTROLLED.test(text);
}
export function deriveSourcingNeeds(
  opportunity: Opportunity,
  requirements: {
    id?: string;
    title: string;
    description: string;
    requirement_type?: string;
    mandatory_status?: string;
    confidence?: string;
  }[] = [],
): SourcingNeed[] {
  const inputs = [
    {
      id: `opportunity-${opportunity.id}`,
      title: opportunity.title,
      description: opportunity.summary,
      critical: true,
    },
    ...requirements.map((r, i) => ({
      id: r.id ?? `requirement-${i}`,
      title: r.title,
      description: r.description,
      critical:
        r.mandatory_status === "mandatory" ||
        r.mandatory_status === "appears_mandatory",
    })),
  ];
  const needs: SourcingNeed[] = [];
  for (const input of inputs) {
    const text = `${input.title} ${input.description}`;
    if (isControlledSourcing(text)) continue;
    const match =
      CAPABILITIES.find(([pattern]) => pattern.test(text)) ??
      ([/./, opportunity.category, "service"] as const);
    const capability = match[1];
    if (
      needs.some(
        (x) =>
          x.capability.toLowerCase() === capability.toLowerCase() &&
          x.description === input.title,
      )
    )
      continue;
    needs.push({
      id: input.id,
      type: match[2],
      capability,
      description: input.title,
      quantity: null,
      specifications: [],
      deliveryCountry: opportunity.country,
      deadline: opportunity.deadline,
      certifications: [],
      brandNames: [],
      critical: input.critical,
    });
  }
  return needs;
}
export function suitableSupplierTypes(need: SourcingNeed): SupplierType[] {
  if (need.type === "logistics") return ["logistics_provider", "subcontractor"];
  if (need.type === "service")
    return ["service_provider", "systems_integrator", "subcontractor"];
  return ["manufacturer", "distributor", "reseller", "systems_integrator"];
}
