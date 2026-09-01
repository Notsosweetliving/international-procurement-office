import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { quoteUpdateSchema } from "@/lib/suppliers/validation";
export async function PATCH(
  request: Request,
  { params }: RouteContext<"/api/bid-workspaces/[id]/suppliers/[assignmentId]">,
) {
  const { id, assignmentId } = await params,
    { client, user } = await getAuthenticatedUser();
  if (!client)
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = quoteUpdateSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid quote or assignment values." },
      { status: 400 },
    );
  const { data: workspace } = await client
    .from("bid_workspaces")
    .select("id")
    .eq("user_id", user.id)
    .eq("source_opportunity_id", id)
    .maybeSingle();
  if (!workspace)
    return NextResponse.json(
      { error: "Bid workspace not found." },
      { status: 404 },
    );
  const { data, error } = await client
    .from("workspace_suppliers")
    .update(parsed.data)
    .eq("id", assignmentId)
    .eq("bid_workspace_id", workspace.id)
    .select("*")
    .single();
  if (error)
    return NextResponse.json(
      { error: "Supplier assignment could not be updated." },
      { status: 400 },
    );
  return NextResponse.json({ assignment: data });
}
