import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { entitlement } from "./entitlements.ts";
import type { Meter, PlanId } from "./plans.ts";
const eventFor: Partial<Record<Meter, string>> = {
  ai_analysis: "ai_analysis",
  ai_question: "ai_question",
  saved_search: "saved_search_created",
};
export async function serverEntitlement(
  db: SupabaseClient,
  userId: string,
  meter: Meter,
) {
  const { data: account } = await db
      .from("subscription_accounts")
      .select("plan,current_period_start")
      .eq("user_id", userId)
      .maybeSingle(),
    plan = (account?.plan ?? "beta_free") as PlanId;
  let used = 0;
  const event = eventFor[meter];
  if (event) {
    const from =
      account?.current_period_start ??
      new Date(
        Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1),
      ).toISOString();
    const { count } = await db
      .from("usage_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("event_type", event)
      .gte("created_at", from);
    used = count ?? 0;
  } else {
    const config: Record<string, [string, string?]> = {
      saved_opportunity: ["saved_opportunities"],
      active_workspace: ["bid_workspaces"],
      supplier: ["suppliers", "owner_user_id"],
    };
    const [table, column = "user_id"] = config[meter] ?? ["saved_searches"];
    const { count } = await db
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq(column, userId);
    used = count ?? 0;
  }
  return { plan, ...entitlement(plan, meter, used) };
}
export async function recordServerEvent(
  userId: string,
  eventType: string,
  activityType?: string,
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  const db = createClient(url, key, { auth: { persistSession: false } });
  await db
    .from("usage_events")
    .insert({ user_id: userId, event_type: eventType });
  if (activityType)
    await db
      .from("activity_events")
      .insert({ user_id: userId, event_type: activityType });
}
