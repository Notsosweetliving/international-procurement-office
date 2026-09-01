import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import {
  isSaved,
  saveOpportunity,
  unsaveOpportunity,
} from "@/lib/repositories/saved";
import { opportunityService } from "@/lib/opportunities/service";
export async function GET(
  _: Request,
  { params }: RouteContext<"/api/saved/[id]">,
) {
  const { id } = await params;
  const { client, user } = await getAuthenticatedUser();
  if (!client)
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ saved: await isSaved(client, user.id, id) });
}
export async function PUT(
  _: Request,
  { params }: RouteContext<"/api/saved/[id]">,
) {
  const { id } = await params;
  const { client, user } = await getAuthenticatedUser();
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
  await saveOpportunity(client, user.id, opportunity);
  return NextResponse.json({ saved: true });
}
export async function DELETE(
  _: Request,
  { params }: RouteContext<"/api/saved/[id]">,
) {
  const { id } = await params;
  const { client, user } = await getAuthenticatedUser();
  if (!client)
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await unsaveOpportunity(client, user.id, id);
  return NextResponse.json({ saved: false });
}
