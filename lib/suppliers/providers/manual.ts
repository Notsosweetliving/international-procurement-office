import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../supabase/database.types.ts";
import { listSuppliers } from "../repository.ts";
import type { SupplierProvider, SupplierSearchParams } from "./types.ts";
export function manualSupplierProvider(
  db: SupabaseClient<Database>,
  userId: string,
): SupplierProvider {
  return {
    name: "My suppliers",
    async search(p: SupplierSearchParams) {
      const suppliers = await listSuppliers(db, userId),
        q = p.query?.toLowerCase();
      return suppliers.filter(
        (s) =>
          (!q ||
            [s.name, s.description, ...s.capabilities, ...s.brands].some((x) =>
              x.toLowerCase().includes(q),
            )) &&
          (!p.country || s.country === p.country) &&
          (!p.supplierType || s.supplierType === p.supplierType) &&
          (!p.capability || s.capabilities.includes(p.capability)) &&
          (!p.region || s.regions.includes(p.region)) &&
          (!p.certification || s.certifications.includes(p.certification)) &&
          (!p.brand || s.brands.includes(p.brand)),
      );
    },
  };
}
