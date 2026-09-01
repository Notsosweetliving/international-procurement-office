import test from "node:test";
import assert from "node:assert/strict";
import {
  deriveSourcingNeeds,
  isControlledSourcing,
} from "../lib/suppliers/taxonomy.ts";
import { calculateSupplierFit } from "../lib/suppliers/matching.ts";
import {
  calculateCostPlan,
  calculateFulfilmentReadiness,
} from "../lib/suppliers/fulfilment.ts";
import { possibleSupplierDuplicate } from "../lib/suppliers/duplicates.ts";
import type { Opportunity } from "../lib/opportunities/types.ts";
import type { SupplierRecord } from "../lib/suppliers/types.ts";

const opportunity = {
  id: "uk-1",
  source: "UK",
  title: "Supply of network switches",
  buyer: "Council",
  country: "United Kingdom",
  category: "Networking",
  summary: "Managed network hardware supply",
  value: 100000,
  currency: "GBP",
  publishedAt: null,
  deadline: null,
  url: "https://example.test",
  cpvCodes: [],
  noticeType: null,
  procedureType: null,
  status: "open",
  raw: {},
} as unknown as Opportunity;
const supplier: SupplierRecord = {
  id: "s1",
  name: "Network Co",
  website: "https://network.test",
  country: "United Kingdom",
  description: "",
  supplierType: "distributor",
  verificationStatus: "user_verified",
  capabilities: ["Networking"],
  regions: ["United Kingdom"],
  certifications: [],
  brands: [],
  estimatedCapacityNotes: "Stock confirmed",
  leadTimeNotes: "14 days",
};

test("sourcing needs do not invent quantity or specifications", () => {
  const [need] = deriveSourcingNeeds(opportunity);
  assert.equal(need.quantity, null);
  assert.deepEqual(need.specifications, []);
  assert.equal(need.capability, "Networking");
});
test("controlled weapons workflows are excluded", () => {
  assert.equal(isControlledSourcing("supply ammunition and firearms"), true);
  assert.deepEqual(
    deriveSourcingNeeds({
      ...opportunity,
      title: "Supply of ammunition",
      summary: "",
    }),
    [],
  );
});
test("supplier fit is deterministic, bounded and explainable", () => {
  const need = deriveSourcingNeeds(opportunity)[0],
    a = calculateSupplierFit(supplier, need),
    b = calculateSupplierFit(supplier, need);
  assert.deepEqual(a, b);
  assert.ok(a.score >= 0 && a.score <= 100);
  assert.equal(
    Object.values(a.breakdown).reduce((x, y) => x + y, 0),
    a.score,
  );
  assert.ok(a.reasons.length);
});
test("duplicate detection is conservative", () => {
  assert.equal(
    possibleSupplierDuplicate([supplier], {
      name: "Different",
      country: "Canada",
      website: "https://www.network.test/about",
    })?.id,
    "s1",
  );
  assert.equal(
    possibleSupplierDuplicate([supplier], {
      name: "Network Co",
      country: "United Kingdom",
      website: "",
    })?.id,
    "s1",
  );
});
test("fulfilment readiness follows its weighted model", () => {
  const need = deriveSourcingNeeds(opportunity)[0],
    fit = calculateSupplierFit(supplier, need);
  const result = calculateFulfilmentReadiness([
    {
      need,
      supplier,
      supplierFit: fit.score,
      quoteStatus: "received",
      quotedAmount: 60000,
      leadTimeDays: 14,
      logisticsCovered: true,
      evidenceComplete: true,
    },
  ]);
  assert.equal(
    Object.values(result.breakdown).reduce((x, y) => x + y, 0),
    result.score,
  );
  assert.equal(result.covered, 1);
  assert.equal(result.gaps.length, 0);
});
test("cost planning only subtracts entered costs", () => {
  assert.deepEqual(
    calculateCostPlan(100000, [
      { quotedAmount: 60000, logisticsCost: 5000, otherCost: null },
    ]),
    { complete: true, totalEnteredCosts: 65000, remainingSpread: 35000 },
  );
  assert.equal(calculateCostPlan(null, []).remainingSpread, null);
});
