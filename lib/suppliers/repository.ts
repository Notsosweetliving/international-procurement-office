import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/database.types.ts";
import type {
  SupplierRecord,
  SupplierType,
  VerificationStatus,
} from "./types.ts";
import type { z } from "zod";
import type { createSupplierSchema } from "./validation.ts";
import { possibleSupplierDuplicate } from "./duplicates.ts";
type CreateSupplier = z.infer<typeof createSupplierSchema>;
export async function listSuppliers(
  db: SupabaseClient<Database>,
  userId: string,
) {
  const { data: rows, error } = await db
    .from("suppliers")
    .select("*")
    .or(`owner_user_id.eq.${userId},owner_user_id.is.null`)
    .order("name");
  if (error) throw error;
  const ids = (rows ?? []).map((x) => x.id);
  if (!ids.length) return [];
  const [caps, regions, certs, brands] = await Promise.all([
    db.from("supplier_capabilities").select("*").in("supplier_id", ids),
    db.from("supplier_regions").select("*").in("supplier_id", ids),
    db.from("supplier_certifications").select("*").in("supplier_id", ids),
    db.from("supplier_brands").select("*").in("supplier_id", ids),
  ]);
  for (const result of [caps, regions, certs, brands])
    if (result.error) throw result.error;
  return (rows ?? []).map(
    (r): SupplierRecord & { ownerUserId: string | null } => ({
      id: r.id,
      ownerUserId: r.owner_user_id,
      name: r.name,
      website: r.website,
      country: r.country,
      description: r.description,
      supplierType: r.supplier_type as SupplierType,
      verificationStatus: r.verification_status as VerificationStatus,
      capabilities: (caps.data ?? [])
        .filter((x) => x.supplier_id === r.id)
        .map((x) => x.capability),
      regions: (regions.data ?? [])
        .filter((x) => x.supplier_id === r.id)
        .map((x) => x.region),
      certifications: (certs.data ?? [])
        .filter((x) => x.supplier_id === r.id)
        .map((x) => x.certification_name),
      brands: (brands.data ?? [])
        .filter((x) => x.supplier_id === r.id)
        .map((x) => x.brand_name),
      estimatedCapacityNotes: r.estimated_capacity_notes,
      leadTimeNotes: r.lead_time_notes,
    }),
  );
}
export async function createPrivateSupplier(
  db: SupabaseClient<Database>,
  userId: string,
  input: CreateSupplier,
) {
  const existing = await listSuppliers(db, userId),
    duplicate = possibleSupplierDuplicate(
      existing.filter((x) => x.ownerUserId === userId),
      input,
    );
  if (duplicate) return { supplier: duplicate, duplicate: true };
  const { data, error } = await db
    .from("suppliers")
    .insert({
      owner_user_id: userId,
      name: input.name,
      website: input.website || null,
      country: input.country,
      description: input.description,
      supplier_type: input.supplierType,
      verification_status: "unverified",
      estimated_capacity_notes: input.estimatedCapacityNotes || null,
      lead_time_notes: input.leadTimeNotes || null,
      minimum_order_notes: input.minimumOrderNotes || null,
      general_notes: input.generalNotes || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  const writes = [];
  if (input.capabilities.length)
    writes.push(
      db.from("supplier_capabilities").insert(
        input.capabilities.map((capability) => ({
          supplier_id: data.id,
          capability,
        })),
      ),
    );
  if (input.regions.length)
    writes.push(
      db
        .from("supplier_regions")
        .insert(
          input.regions.map((region) => ({ supplier_id: data.id, region })),
        ),
    );
  if (input.certifications.length)
    writes.push(
      db.from("supplier_certifications").insert(
        input.certifications.map((certification_name) => ({
          supplier_id: data.id,
          certification_name,
        })),
      ),
    );
  if (input.brands.length)
    writes.push(
      db.from("supplier_brands").insert(
        input.brands.map((brand_name) => ({
          supplier_id: data.id,
          brand_name,
        })),
      ),
    );
  for (const result of await Promise.all(writes))
    if (result.error) {
      await db
        .from("suppliers")
        .delete()
        .eq("id", data.id)
        .eq("owner_user_id", userId);
      throw result.error;
    }
  return { supplier: data, duplicate: false };
}
export async function supplierWorkspaceContext(
  db: SupabaseClient<Database>,
  userId: string,
  opportunityId: string,
) {
  const { data: workspace, error } = await db
    .from("bid_workspaces")
    .select("id")
    .eq("user_id", userId)
    .eq("source_opportunity_id", opportunityId)
    .maybeSingle();
  if (error || !workspace) return null;
  const { data: assignments, error: assignmentError } = await db
    .from("workspace_suppliers")
    .select("*")
    .eq("bid_workspace_id", workspace.id);
  if (assignmentError) throw assignmentError;
  const suppliers = await listSuppliers(db, userId);
  const { data: requirementAssignments, error: reqError } = await db
    .from("requirement_suppliers")
    .select("*")
    .in(
      "workspace_supplier_id",
      (assignments ?? []).map((x) => x.id).length
        ? (assignments ?? []).map((x) => x.id)
        : ["00000000-0000-0000-0000-000000000000"],
    );
  if (reqError) throw reqError;
  return {
    workspace,
    assignments: assignments ?? [],
    requirementAssignments: requirementAssignments ?? [],
    suppliers,
  };
}
