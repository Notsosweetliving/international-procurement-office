import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import {
  deleteSavedSearch,
  renameSavedSearch,
} from "@/lib/saved-searches/repository";
const rename = z.object({ name: z.string().trim().min(1).max(160) });
export async function PATCH(
  request: Request,
  { params }: RouteContext<"/api/saved-searches/[id]">,
) {
  const { id } = await params,
    { client, user } = await getAuthenticatedUser();
  if (!client || !user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = rename.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  await renameSavedSearch(client, user.id, id, parsed.data.name);
  return NextResponse.json({ updated: true });
}
export async function DELETE(
  _: Request,
  { params }: RouteContext<"/api/saved-searches/[id]">,
) {
  const { id } = await params,
    { client, user } = await getAuthenticatedUser();
  if (!client || !user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await deleteSavedSearch(client, user.id, id);
  return NextResponse.json({ deleted: true });
}
