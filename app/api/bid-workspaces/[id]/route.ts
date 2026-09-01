import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { opportunityService } from "@/lib/opportunities/service";
import {
  ensureBidWorkspace,
  getBidWorkspace,
} from "@/lib/repositories/bid-workspace";
const updateSchema = z
  .object({
    decision: z
      .enum(["undecided", "pursue", "review", "do_not_bid"])
      .optional(),
    notes: z.string().max(5000).optional(),
  })
  .refine((x) => x.decision !== undefined || x.notes !== undefined);
export async function GET(
  _: Request,
  { params }: RouteContext<"/api/bid-workspaces/[id]">,
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
    bidWorkspace: await getBidWorkspace(client, user.id, id),
  });
}
export async function POST(
  _: Request,
  { params }: RouteContext<"/api/bid-workspaces/[id]">,
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
  const opportunity = await opportunityService.getById(id);
  if (!opportunity)
    return NextResponse.json(
      { error: "Opportunity not found." },
      { status: 404 },
    );
  await ensureBidWorkspace(client, user.id, opportunity);
  return NextResponse.json(
    { bidWorkspace: await getBidWorkspace(client, user.id, id) },
    { status: 201 },
  );
}
export async function PATCH(
  request: Request,
  { params }: RouteContext<"/api/bid-workspaces/[id]">,
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
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid workspace update." },
      { status: 400 },
    );
  const { data, error } = await client
    .from("bid_workspaces")
    .update(parsed.data)
    .eq("user_id", user.id)
    .eq("source_opportunity_id", id)
    .select("*")
    .single();
  if (error)
    return NextResponse.json(
      { error: "Bid workspace could not be updated." },
      { status: 400 },
    );
  return NextResponse.json({ workspace: data });
}
