import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { savedSearchSchema } from "@/lib/saved-searches/validation";
import {
  createSavedSearch,
  listSavedSearches,
} from "@/lib/saved-searches/repository";
import { serverEntitlement, recordServerEvent } from "@/lib/billing/server";
export async function GET() {
  const { client, user } = await getAuthenticatedUser();
  if (!client || !user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const access = await serverEntitlement(client, user.id, "saved_search").catch(
    () => ({ allowed: true }),
  );
  if (!access.allowed)
    return NextResponse.json(
      { error: "Saved search limit reached for your current plan." },
      { status: 403 },
    );
  try {
    return NextResponse.json({
      savedSearches: await listSavedSearches(client, user.id),
    });
  } catch {
    return NextResponse.json({ savedSearches: [], setupRequired: true });
  }
}
export async function POST(request: Request) {
  const { client, user } = await getAuthenticatedUser();
  if (!client || !user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = savedSearchSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message },
      { status: 400 },
    );
  try {
    const savedSearch = await createSavedSearch(client, user.id, parsed.data);
    await recordServerEvent(
      user.id,
      "saved_search_created",
      "saved_search_created",
    );
    return NextResponse.json({ savedSearch }, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        error:
          "Saved search storage is unavailable or your plan limit was reached.",
      },
      { status: 400 },
    );
  }
}
