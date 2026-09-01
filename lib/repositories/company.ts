import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/database.types.ts";
import type { CompanyProfile } from "../opportunities/types.ts";
import { isCompanyProfile } from "../company/profile.ts";
export type CompanyRow = Database["public"]["Tables"]["companies"]["Row"];
export function mapCompanyProfile(
  company: CompanyRow,
  businessModels: string[],
  capabilities: string[],
  regions: string[],
  certifications: string[],
): CompanyProfile {
  return {
    name: company.name,
    country: company.country,
    website: company.website,
    businessModels,
    capabilities,
    minContractValue: company.min_contract_value ?? 0,
    maxContractValue: company.max_contract_value ?? 0,
    preferredCurrency: company.preferred_currency ?? "EUR",
    regions,
    certifications,
    governmentExperience: company.government_experience,
  };
}
export function validImportedProfile(value: unknown) {
  return isCompanyProfile(value);
}
export async function getCompanyProfile(
  db: SupabaseClient<Database>,
  userId: string,
) {
  const { data: company, error } = await db
    .from("companies")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!company) return null;
  const [models, caps, regions, certs] = await Promise.all([
    db
      .from("company_business_models")
      .select("business_model")
      .eq("company_id", company.id),
    db
      .from("company_capabilities")
      .select("capability")
      .eq("company_id", company.id),
    db.from("company_regions").select("region").eq("company_id", company.id),
    db
      .from("company_certifications")
      .select("certification_name")
      .eq("company_id", company.id),
  ]);
  for (const result of [models, caps, regions, certs])
    if (result.error) throw result.error;
  return mapCompanyProfile(
    company,
    (models.data ?? []).map((x) => x.business_model),
    (caps.data ?? []).map((x) => x.capability),
    (regions.data ?? []).map((x) => x.region),
    (certs.data ?? []).map((x) => x.certification_name),
  );
}
export async function saveCompanyProfile(
  db: SupabaseClient<Database>,
  userId: string,
  value: unknown,
) {
  if (!isCompanyProfile(value)) throw new Error("Invalid company profile.");
  const p = value;
  const { data: company, error } = await db
    .from("companies")
    .upsert(
      {
        user_id: userId,
        name: p.name,
        country: p.country,
        website: p.website,
        min_contract_value: p.minContractValue,
        max_contract_value: p.maxContractValue,
        preferred_currency: p.preferredCurrency,
        government_experience: p.governmentExperience,
      },
      { onConflict: "user_id" },
    )
    .select("id")
    .single();
  if (error) throw error;
  const deletes = await Promise.all([
    db.from("company_business_models").delete().eq("company_id", company.id),
    db.from("company_capabilities").delete().eq("company_id", company.id),
    db.from("company_regions").delete().eq("company_id", company.id),
    db.from("company_certifications").delete().eq("company_id", company.id),
  ]);
  for (const result of deletes) if (result.error) throw result.error;
  const writes = [];
  if (p.businessModels.length)
    writes.push(
      db.from("company_business_models").insert(
        p.businessModels.map((business_model) => ({
          company_id: company.id,
          business_model,
        })),
      ),
    );
  if (p.capabilities.length)
    writes.push(
      db.from("company_capabilities").insert(
        p.capabilities.map((capability) => ({
          company_id: company.id,
          capability,
        })),
      ),
    );
  if (p.regions.length)
    writes.push(
      db
        .from("company_regions")
        .insert(
          p.regions.map((region) => ({ company_id: company.id, region })),
        ),
    );
  if (p.certifications.length)
    writes.push(
      db.from("company_certifications").insert(
        p.certifications.map((certification_name) => ({
          company_id: company.id,
          certification_name,
        })),
      ),
    );
  for (const result of await Promise.all(writes))
    if (result.error) throw result.error;
  return p;
}
