import type { SupplierProvider } from "./types.ts";
export const webSupplierProvider: SupplierProvider = {
  name: "Public web discovery beta",
  async search() {
    return [];
  },
};
