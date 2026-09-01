import type { SupplierRecord } from "../types.ts";
export interface SupplierSearchParams {
  query?: string;
  country?: string;
  supplierType?: string;
  capability?: string;
  region?: string;
  certification?: string;
  brand?: string;
}
export interface SupplierProvider {
  name: string;
  search(params: SupplierSearchParams): Promise<SupplierRecord[]>;
}
