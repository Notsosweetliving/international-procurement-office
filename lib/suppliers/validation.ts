import { z } from "zod";
export const supplierTypeSchema = z.enum([
  "manufacturer",
  "distributor",
  "reseller",
  "systems_integrator",
  "service_provider",
  "logistics_provider",
  "subcontractor",
]);
const optionalUrl = z
  .union([z.literal(""), z.string().url().max(500)])
  .optional();
const list = z.array(z.string().trim().min(1).max(120)).max(30).default([]);
export const createSupplierSchema = z.object({
  name: z.string().trim().min(1).max(300),
  website: optionalUrl,
  country: z.string().trim().max(120).default(""),
  description: z.string().trim().max(3000).default(""),
  supplierType: supplierTypeSchema,
  capabilities: list,
  regions: list,
  certifications: list,
  brands: list,
  estimatedCapacityNotes: z.string().trim().max(2000).optional(),
  leadTimeNotes: z.string().trim().max(2000).optional(),
  minimumOrderNotes: z.string().trim().max(2000).optional(),
  generalNotes: z.string().trim().max(4000).optional(),
});
export const quoteUpdateSchema = z.object({
  status: z.enum(["potential", "reviewing", "selected", "rejected"]).optional(),
  quote_status: z
    .enum(["not_requested", "requested", "received", "declined", "expired"])
    .optional(),
  quoted_amount: z.number().nonnegative().nullable().optional(),
  quoted_currency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .nullable()
    .optional(),
  lead_time_days: z.number().int().min(0).max(3650).nullable().optional(),
  quote_valid_until: z.string().date().nullable().optional(),
  notes: z.string().max(4000).nullable().optional(),
  logistics_cost: z.number().nonnegative().nullable().optional(),
  other_cost: z.number().nonnegative().nullable().optional(),
});
