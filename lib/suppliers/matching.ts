import { suitableSupplierTypes } from "./taxonomy.ts";
import type { SourcingNeed, SupplierFit, SupplierRecord } from "./types.ts";
const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, "");
const includes = (values: string[], target: string) =>
  values.some(
    (v) => norm(v).includes(norm(target)) || norm(target).includes(norm(v)),
  );
export function supplierFitLabel(score: number): SupplierFit["label"] {
  return score >= 90
    ? "Strong supplier fit"
    : score >= 75
      ? "Good supplier fit"
      : score >= 50
        ? "Possible supplier fit"
        : "Weak supplier fit";
}
export function calculateSupplierFit(
  supplier: SupplierRecord,
  need: SourcingNeed,
): SupplierFit {
  const reasons: string[] = [],
    checks: string[] = [];
  const capability = includes(supplier.capabilities, need.capability) ? 30 : 0;
  if (capability) reasons.push(`Supplies ${need.capability}`);
  else checks.push("Required capability is not listed");
  const geography =
    includes(supplier.regions, need.deliveryCountry) ||
    includes(supplier.regions, "Worldwide")
      ? 20
      : supplier.country === need.deliveryCountry
        ? 15
        : 0;
  if (geography) reasons.push(`Serves ${need.deliveryCountry}`);
  else checks.push("Delivery-region coverage is not confirmed");
  const certifications = need.certifications.length
    ? Math.round(
        (15 *
          need.certifications.filter((x) =>
            includes(supplier.certifications, x),
          ).length) /
          need.certifications.length,
      )
    : 15;
  if (certifications === 15 && need.certifications.length)
    reasons.push("Required certifications are listed");
  else if (need.certifications.length)
    checks.push("One or more required certifications are unconfirmed");
  const supplierType = suitableSupplierTypes(need).includes(
    supplier.supplierType,
  )
    ? 10
    : 0;
  if (supplierType) reasons.push("Supplier model is suitable");
  else checks.push("Supplier type may not suit this need");
  const brand = need.brandNames.length
    ? Math.round(
        (10 *
          need.brandNames.filter((x) => includes(supplier.brands, x)).length) /
          need.brandNames.length,
      )
    : 5;
  if (brand === 10) reasons.push("Requested brand compatibility is listed");
  else if (need.brandNames.length)
    checks.push("Brand authorization is not confirmed");
  const capacity = supplier.estimatedCapacityNotes ? 5 : 0,
    lead = supplier.leadTimeNotes ? 5 : 0,
    capacityLeadTime = capacity + lead;
  if (!capacity) checks.push("Capacity not confirmed");
  if (!lead) checks.push("Lead time unknown");
  const evidence =
    supplier.verificationStatus !== "unverified" ? 5 : supplier.website ? 2 : 0;
  if (evidence) reasons.push("Supplier evidence is available");
  else checks.push("Supplier remains unverified");
  const breakdown = {
      capability,
      geography,
      certifications,
      supplierType,
      brand,
      capacityLeadTime,
      evidence,
    },
    score = Math.min(
      100,
      Math.max(
        0,
        Object.values(breakdown).reduce((a, b) => a + b, 0),
      ),
    );
  return { score, label: supplierFitLabel(score), reasons, checks, breakdown };
}
