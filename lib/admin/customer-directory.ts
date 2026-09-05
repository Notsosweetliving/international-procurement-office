import type { SupabaseClient } from "@supabase/supabase-js";

export type CustomerDirectoryFilters = {
  search?: string;
  signupDate?: string;
  marketing?: "yes" | "no" | "all";
};

export type CustomerDirectoryRow = {
  id: string;
  email: string;
  signupAt: string;
  lastActiveAt: string | null;
  company: string;
  country: string;
  completeness: number;
  plan: string;
  marketingOptIn: boolean;
};

export async function getCustomerDirectory(
  db: SupabaseClient,
  filters: CustomerDirectoryFilters,
): Promise<CustomerDirectoryRow[]> {
  const [{ data: authData, error: authError }, companies, profiles, subscriptions] =
    await Promise.all([
      db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      db.from("companies").select("*"),
      db.from("profiles").select("id,marketing_opt_in"),
      db.from("subscription_accounts").select("user_id,plan"),
    ]);
  if (authError) throw authError;
  const companyByUser = new Map(
    (companies.data ?? []).map((company) => [company.user_id, company]),
  );
  const profileByUser = new Map(
    (profiles.data ?? []).map((profile) => [profile.id, profile]),
  );
  const planByUser = new Map(
    (subscriptions.data ?? []).map((account) => [account.user_id, account.plan]),
  );
  const search = filters.search?.trim().toLowerCase() ?? "";
  return authData.users
    .map((user): CustomerDirectoryRow => {
      const company = companyByUser.get(user.id);
      const completed = company
        ? [
            company.name,
            company.country,
            company.website,
            company.min_contract_value,
            company.max_contract_value,
            company.preferred_currency,
            company.government_experience,
          ].filter((value) => value !== null && value !== "").length
        : 0;
      return {
        id: user.id,
        email: user.email ?? "—",
        signupAt: user.created_at,
        lastActiveAt: user.last_sign_in_at ?? null,
        company: company?.name || "—",
        country: company?.country || "—",
        completeness: Math.round((completed / 7) * 100),
        plan: planByUser.get(user.id) ?? "beta_free",
        marketingOptIn:
          profileByUser.get(user.id)?.marketing_opt_in === true,
      };
    })
    .filter((row) => {
      if (
        search &&
        !row.email.toLowerCase().includes(search) &&
        !row.company.toLowerCase().includes(search)
      )
        return false;
      if (filters.signupDate && !row.signupAt.startsWith(filters.signupDate))
        return false;
      if (filters.marketing === "yes" && !row.marketingOptIn) return false;
      if (filters.marketing === "no" && row.marketingOptIn) return false;
      return true;
    })
    .sort((a, b) => b.signupAt.localeCompare(a.signupAt));
}

