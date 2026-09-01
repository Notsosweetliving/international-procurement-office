import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/supabase/server";
const schema = z.object({ password: z.string().min(8).max(200) });
export async function PATCH(request: Request) {
  const { client, user } = await getAuthenticatedUser();
  if (!client || !user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  const { error } = await client.auth.updateUser({
    password: parsed.data.password,
  });
  return error
    ? NextResponse.json({ error: error.message }, { status: 400 })
    : NextResponse.json({ updated: true });
}
