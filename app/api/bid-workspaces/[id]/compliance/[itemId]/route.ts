import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { recalculateBidWorkspace } from "@/lib/repositories/bid-workspace";
const schema = z.object({
  status: z
    .enum([
      "meets",
      "likely_meets",
      "needs_evidence",
      "missing",
      "needs_review",
      "not_applicable",
    ])
    .optional(),
  user_note: z.string().max(2000).optional(),
  evidence_document_id: z.string().uuid().nullable().optional(),
});
export async function PATCH(
  request: Request,
  { params }: RouteContext<"/api/bid-workspaces/[id]/compliance/[itemId]">,
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
      { error: "Invalid compliance update." },
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
  if (parsed.data.evidence_document_id) {
    const { data: evidence } = await client
      .from("tender_documents")
      .select("id")
      .eq("id", parsed.data.evidence_document_id)
      .eq("user_id", user.id)
      .eq("source_opportunity_id", id)
      .maybeSingle();
    if (!evidence)
      return NextResponse.json(
        { error: "Evidence document not found." },
        { status: 400 },
      );
  }
  const { data, error } = await client
    .from("compliance_items")
    .update(parsed.data)
    .eq("id", itemId)
    .eq("bid_workspace_id", workspace.id)
    .select("*")
    .single();
  if (error)
    return NextResponse.json(
      { error: "Compliance item could not be updated." },
      { status: 400 },
    );
  await recalculateBidWorkspace(client, user.id, id, null);
  return NextResponse.json({ item: data });
}
