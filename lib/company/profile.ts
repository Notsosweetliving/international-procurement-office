import type { CompanyProfile } from "../opportunities/types";
export const PROFILE_STORAGE_KEY = "contractos_company_profile_v1";
export const EMPTY_PROFILE: CompanyProfile = {
  name: "",
  country: "",
  website: "",
  businessModels: [],
  capabilities: [],
  minContractValue: 0,
  maxContractValue: 0,
  preferredCurrency: "GBP",
  regions: [],
  certifications: [],
  governmentExperience: "None",
};
export const EXAMPLE_PROFILE: CompanyProfile = {
  name: "Northstar Technologies Ltd",
  country: "United Kingdom",
  website: "",
  businessModels: ["Distributor", "Reseller"],
  capabilities: ["IT hardware", "Networking", "Cybersecurity", "Electronics"],
  minContractValue: 100000,
  maxContractValue: 5000000,
  preferredCurrency: "GBP",
  regions: ["United Kingdom", "European Union", "NATO"],
  certifications: ["ISO 9001", "Cyber Essentials Plus"],
  governmentExperience: "Some government experience",
};
export function isCompanyProfile(v: unknown): v is CompanyProfile {
  if (!v || typeof v !== "object") return false;
  const p = v as Partial<CompanyProfile>;
  return (
    typeof p.name === "string" &&
    typeof p.country === "string" &&
    Array.isArray(p.capabilities) &&
    Array.isArray(p.businessModels) &&
    Array.isArray(p.regions) &&
    Array.isArray(p.certifications) &&
    typeof p.minContractValue === "number" &&
    typeof p.maxContractValue === "number"
  );
}
export function profileCompleteness(p: CompanyProfile) {
  const checks = [
    p.name,
    p.country,
    p.website,
    p.businessModels.length,
    p.capabilities.length,
    p.maxContractValue > 0,
    p.regions.length,
    p.certifications.length,
    p.governmentExperience !== "None",
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
