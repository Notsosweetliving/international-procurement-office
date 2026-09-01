import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyStripeSignature } from "@/lib/billing/stripe";
export async function POST(request: Request) {
  const payload = await request.text(),
    secret = process.env.STRIPE_WEBHOOK_SECRET ?? "",
    signature = request.headers.get("stripe-signature") ?? "";
  if (!secret || !verifyStripeSignature(payload, signature, secret))
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  const event = JSON.parse(payload),
    object = event.data?.object,
    userId = object?.metadata?.user_id,
    url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (
    userId &&
    url &&
    key &&
    [
      "checkout.session.completed",
      "customer.subscription.updated",
      "customer.subscription.deleted",
    ].includes(event.type)
  ) {
    const db = createClient(url, key, { auth: { persistSession: false } });
    await db.from("subscription_accounts").upsert({
      user_id: userId,
      plan:
        event.type === "customer.subscription.deleted" ? "beta_free" : "pro",
      status: object.status ?? "active",
      stripe_customer_id: object.customer ?? null,
      stripe_subscription_id: object.subscription ?? object.id ?? null,
      updated_at: new Date().toISOString(),
    });
  }
  return NextResponse.json({ received: true });
}
