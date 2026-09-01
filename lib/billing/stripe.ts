import { createHmac, timingSafeEqual } from "node:crypto";
export function verifyStripeSignature(
  payload: string,
  header: string,
  secret: string,
  now = Math.floor(Date.now() / 1000),
) {
  const parts = Object.fromEntries(
      header.split(",").map((x) => x.split("=", 2)),
    ),
    timestamp = Number(parts.t),
    signature = parts.v1;
  if (!timestamp || !signature || Math.abs(now - timestamp) > 300) return false;
  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
  const a = Buffer.from(signature),
    b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function stripeConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_WEBHOOK_SECRET &&
    process.env.STRIPE_PRICE_PRO,
  );
}
