import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { searchCachedOpportunities } from "@/lib/opportunities/cache";
import type { OpportunitySource } from "@/lib/opportunities/types";
const list = (value: string | null) => value?.split(",").map((x) => x.trim()).filter(Boolean);
const number = (value: string | null) => value && Number.isFinite(Number(value)) ? Number(value) : undefined;
export async function GET(request: Request) {
  const { client, user } = await getAuthenticatedUser();
  if (!client || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const p = new URL(request.url).searchParams, source = p.get("source"), offset = Math.max(0, number(p.get("offset")) ?? 0), limit = Math.min(50, Math.max(1, number(p.get("limit")) ?? 50));
  const result = await searchCachedOpportunities(client, { query: p.get("q") ?? undefined, sources: source && ["TED", "UK", "SAM"].includes(source) ? [source as OpportunitySource] : undefined, countries: list(p.get("countries")), categories: list(p.get("categories")), minValue: number(p.get("minValue")), maxValue: number(p.get("maxValue")), currency: p.get("currency") ?? undefined, closingWithinDays: number(p.get("closingWithinDays")), sort: p.get("sort") === "closing_soon" ? "deadline" : p.get("sort") === "highest_value" ? "value_desc" : "newest", page: Math.floor(offset / limit) + 1, limit });
  return NextResponse.json(result);
}
