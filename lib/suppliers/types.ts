export type SupplierType =
  | "manufacturer"
  | "distributor"
  | "reseller"
  | "systems_integrator"
  | "service_provider"
  | "logistics_provider"
  | "subcontractor";
export type VerificationStatus =
  "unverified" | "user_verified" | "source_verified";
export type QuoteStatus =
  "not_requested" | "requested" | "received" | "declined" | "expired";
export interface SupplierRecord {
  id: string;
  name: string;
  website: string | null;
  country: string;
  description: string;
  supplierType: SupplierType;
  verificationStatus: VerificationStatus;
  capabilities: string[];
  regions: string[];
  certifications: string[];
  brands: string[];
  estimatedCapacityNotes?: string | null;
  leadTimeNotes?: string | null;
}
export interface SourcingNeed {
  id: string;
  type: "product" | "service" | "logistics";
  capability: string;
  description: string;
  quantity: number | null;
  specifications: string[];
  deliveryCountry: string;
  deadline: string | null;
  certifications: string[];
  brandNames: string[];
  critical: boolean;
}
export interface SupplierFit {
  score: number;
  label:
    | "Strong supplier fit"
    | "Good supplier fit"
    | "Possible supplier fit"
    | "Weak supplier fit";
  reasons: string[];
  checks: string[];
  breakdown: {
    capability: number;
    geography: number;
    certifications: number;
    supplierType: number;
    brand: number;
    capacityLeadTime: number;
    evidence: number;
  };
}
export interface FulfilmentAssignment {
  need: SourcingNeed;
  supplier: SupplierRecord | null;
  supplierFit: number | null;
  quoteStatus: QuoteStatus;
  quotedAmount: number | null;
  leadTimeDays: number | null;
  logisticsCovered: boolean;
  evidenceComplete: boolean;
}
