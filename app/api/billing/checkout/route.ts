import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";
export async function POST(request: Request) {
  const { user } = await getAuthenticatedUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const key = process.env.STRIPE_SECRET_KEY,
    price = process.env.STRIPE_PRICE_PRO;
  if (!key || !price)
    return NextResponse.json(
      { error: "Stripe test mode is not configured." },
      { status: 503 },
    );
  const origin = new URL(request.url).origin,
    body = new URLSearchParams({
      mode: "subscription",
      "line_items[0][price]": price,
      "line_items[0][quantity]": "1",
      success_url: `${origin}/settings?billing=success`,
      cancel_url: `${origin}/settings?billing=cancelled`,
      customer_email: user.email ?? "",
      "metadata[user_id]": user.id,
    });
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = await response.json();
  return response.ok
    ? NextResponse.json({ url: data.url })
    : NextResponse.json(
        { error: "Checkout could not be created." },
        { status: 502 },
      );
}
