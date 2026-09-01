import { NextResponse } from "next/server";
import { createClient as adminClient } from "@supabase/supabase-js";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { ACCOUNT_TABLES, storageCleanupPrefix } from "@/lib/account/deletion";
export async function DELETE(request: Request) {
  const { user } = await getAuthenticatedUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (body.confirmation !== "DELETE MY ACCOUNT")
    return NextResponse.json(
      { error: "Type DELETE MY ACCOUNT to confirm." },
      { status: 400 },
    );
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    return NextResponse.json(
      { error: "Account deletion service is not configured." },
      { status: 503 },
    );
  const db = adminClient(url, key, { auth: { persistSession: false } }),
    bucket = db.storage.from("tender-documents"),
    prefix = storageCleanupPrefix(user.id),
    { data: files } = await bucket.list(prefix, { limit: 1000 });
  if (files?.length) await bucket.remove(files.map((x) => prefix + x.name));
  for (const table of ACCOUNT_TABLES)
    await db
      .from(table)
      .delete()
      .eq(
        table === "subscription_accounts"
          ? "user_id"
          : table === "companies"
            ? "user_id"
            : "user_id",
        user.id,
      );
  const { error } = await db.auth.admin.deleteUser(user.id);
  if (error)
    return NextResponse.json(
      { error: "Account deletion could not be completed." },
      { status: 500 },
    );
  return NextResponse.json({ deleted: true });
}
