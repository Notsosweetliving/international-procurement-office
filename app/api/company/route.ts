import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import {
  getCompanyProfile,
  saveCompanyProfile,
} from "@/lib/repositories/company";
export async function GET() {
  const { client, user } = await getAuthenticatedUser();
  if (!client)
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    profile: await getCompanyProfile(client, user.id),
  });
}
export async function PUT(request: Request) {
  const { client, user } = await getAuthenticatedUser();
  if (!client)
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({
      profile: await saveCompanyProfile(client, user.id, await request.json()),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Profile could not be saved.",
      },
      { status: 400 },
    );
  }
}
