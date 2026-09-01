import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { recalculateBidWorkspace } from "@/lib/repositories/bid-workspace";
const schema = z.object({ completed: z.boolean() });
export async function PATCH(
  request: Request,
  { params }: RouteContext<"/api/bid-workspaces/[id]/checklist/[itemId]">,
) {
  const { id, itemId } = await params,
    { client, user } = await getAuthenticatedUser();
  if (!client)
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid checklist update." },
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
    .from("bid_submission_items")
    .update(parsed.data)
    .eq("id", itemId)
    .eq("bid_workspace_id", workspace.id)
    .select("*")
    .single();
  if (error)
    return NextResponse.json(
      { error: "Checklist item could not be updated." },
      { status: 400 },
    );
  await recalculateBidWorkspace(client, user.id, id, null);
  return NextResponse.json({ item: data });
}
