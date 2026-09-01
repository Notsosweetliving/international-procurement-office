import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { createSupplierSchema } from "@/lib/suppliers/validation";
import {
  createPrivateSupplier,
  listSuppliers,
} from "@/lib/suppliers/repository";
import { serverEntitlement, recordServerEvent } from "@/lib/billing/server";
export async function GET() {
  const { client, user } = await getAuthenticatedUser();
  if (!client)
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ suppliers: await listSuppliers(client, user.id) });
}
export async function POST(request: Request) {
  const { client, user } = await getAuthenticatedUser();
  if (!client)
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const access = await serverEntitlement(client, user.id, "supplier").catch(
    () => ({ allowed: true }),
  );
  if (!access.allowed)
    return NextResponse.json(
      { error: "Supplier limit reached for your current plan." },
      { status: 403 },
    );
  const parsed = createSupplierSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid supplier details.", details: parsed.error.flatten() },
      { status: 400 },
    );
  try {
    const result = await createPrivateSupplier(client, user.id, parsed.data);
    if (!result.duplicate)
      await recordServerEvent(user.id, "supplier_created", "supplier_created");
    return NextResponse.json(result, { status: result.duplicate ? 200 : 201 });
  } catch {
    return NextResponse.json(
      { error: "Supplier could not be saved." },
      { status: 400 },
    );
  }
}
