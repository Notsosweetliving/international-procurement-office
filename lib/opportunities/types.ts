export interface Buyer {
  id: string;
  name: string;
  type: string;
  country: string;
  website?: string;
}
export interface OpportunityRequirement {
  id: string;
  title: string;
  detail: string;
  mandatory: boolean;
}
export interface OpportunityMatch {
  score: number;
  reasons: string[];
  issues: string[];
  derivedByAi: boolean;
}
export interface OpportunityDocument {
  id: string;
  name: string;
  type: string;
  size: string;
}
export type OpportunitySource = "TED" | "NATO" | "UK" | "SAM" | "mock";
export interface Opportunity {
  id: string;
  reference: string;
  title: string;
  buyer: Buyer;
  country: string;
  category: string;
  value: number | null;
  currency: string | null;
  publishedAt: string | null;
  deadline: string | null;
  eligibility: string;
  summary: string;
  match: OpportunityMatch | null;
  requirements: OpportunityRequirement[];
  documents: OpportunityDocument[];
  saved?: boolean;
  source?: OpportunitySource;
  sourceUrl?: string;
  descriptionUrl?: string;
  cpvCodes?: string[];
  naicsCodes?: string[];
  pscCodes?: string[];
  procedureType?: string;
  sourceOrganization?: string;
}
export interface CompanyProfile {
  name: string;
  country: string;
  website: string;
  capabilities: string[];
  businessModels: string[];
  minContractValue: number;
  maxContractValue: number;
  preferredCurrency?: string;
  regions: string[];
  certifications: string[];
  governmentExperience: string;
}
