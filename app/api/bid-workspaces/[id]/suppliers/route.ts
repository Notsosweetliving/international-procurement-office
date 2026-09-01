import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { supplierWorkspaceContext } from "@/lib/suppliers/repository";
const assignSchema = z.object({
  supplierId: z.string().uuid(),
  requirementId: z.string().uuid().optional(),
  role: z.string().trim().min(1).max(120).default("potential_supplier"),
});
export async function GET(
  _: Request,
  { params }: RouteContext<"/api/bid-workspaces/[id]/suppliers">,
) {
  const { id } = await params,
    { client, user } = await getAuthenticatedUser();
  if (!client)
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    supplierContext: await supplierWorkspaceContext(client, user.id, id),
  });
}
export async function POST(
  request: Request,
  { params }: RouteContext<"/api/bid-workspaces/[id]/suppliers">,
) {
  const { id } = await params,
    { client, user } = await getAuthenticatedUser();
  if (!client)
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = assignSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid supplier assignment." },
      { status: 400 },
    );
  const context = await supplierWorkspaceContext(client, user.id, id);
  if (!context)
    return NextResponse.json(
      { error: "Bid workspace not found." },
      { status: 404 },
    );
  const supplier = context.suppliers.find(
    (x) => x.id === parsed.data.supplierId,
  );
  if (!supplier)
    return NextResponse.json({ error: "Supplier not found." }, { status: 404 });
  const { data: assignment, error } = await client
    .from("workspace_suppliers")
    .upsert(
      {
        bid_workspace_id: context.workspace.id,
        supplier_id: supplier.id,
        role: parsed.data.role,
      },
      { onConflict: "bid_workspace_id,supplier_id" },
    )
    .select("*")
    .single();
  if (error)
    return NextResponse.json(
      { error: "Supplier could not be assigned." },
      { status: 400 },
    );
  if (parsed.data.requirementId) {
    const { data: requirement } = await client
      .from("tender_requirements")
      .select("id")
      .eq("id", parsed.data.requirementId)
      .eq("user_id", user.id)
      .eq("source_opportunity_id", id)
      .maybeSingle();
    if (!requirement)
      return NextResponse.json(
        { error: "Requirement not found." },
        { status: 404 },
      );
    const { error: reqError } = await client
      .from("requirement_suppliers")
      .upsert(
        {
          requirement_id: requirement.id,
          supplier_id: supplier.id,
          workspace_supplier_id: assignment.id,
          suitability_status: "potential",
        },
        { onConflict: "requirement_id,supplier_id" },
      );
    if (reqError)
      return NextResponse.json(
        { error: "Requirement assignment could not be saved." },
        { status: 400 },
      );
  }
  return NextResponse.json({ assignment }, { status: 201 });
}
