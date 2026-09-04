import { NextResponse } from "next/server";
import { searchRequestSchema } from "@/lib/ai/schemas";
import { allowAiRequest } from "@/lib/ai/rate-limit";
import { parseSearchIntent } from "@/lib/ai/search-intent";
import { searchCachedOpportunities } from "@/lib/opportunities/cache";
import { calculateOpportunityMatch } from "@/lib/matching/engine";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getCompanyProfile } from "@/lib/repositories/company";
import { AI_CANDIDATE_LIMIT, AI_PREVIEW_LIMIT, expandSearchIntent, matchesHardConstraints, serializeSearchIntent } from "@/lib/ai/opportunity-search";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!allowAiRequest("search", 10))
    return NextResponse.json(
      { error: "Too many searches. Try again shortly." },
      { status: 429 },
    );
  const { client, user } = await getAuthenticatedUser();
  if (!client)
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = searchRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return NextResponse.json(
      { error: "Search must be between 2 and 500 characters." },
      { status: 400 },
    );
  const [intent, profile] = await Promise.all([
    parseSearchIntent(parsed.data.query),
    getCompanyProfile(client, user.id),
  ]);
  const expandedIntent = expandSearchIntent(intent);
  const deadlineBefore = expandedIntent.closingWithinDays
    ? new Date(Date.now() + expandedIntent.closingWithinDays * 86400000).toISOString()
    : undefined;
  const queryParams = {
    query: expandedIntent.keywords?.join(" "),
    sources: expandedIntent.sources,
    countries: expandedIntent.countries,
    categories: expandedIntent.categories,
    minValue: expandedIntent.minValue,
    maxValue: expandedIntent.maxValue,
    currency: expandedIntent.currency,
    deadlineBefore,
    limit: AI_CANDIDATE_LIMIT,
  };
  let result = await searchCachedOpportunities(client, queryParams);
  let fallbackApplied = false;
  if (!result.items.length && queryParams.query && expandedIntent.categories?.length) {
    result = await searchCachedOpportunities(client, { ...queryParams, query: undefined });
    fallbackApplied = true;
  }
  const now = Date.now();
  let items = result.items.filter(
    (o) =>
      matchesHardConstraints(o, expandedIntent, now),
  );
  const minimumMatchScore = intent.minimumMatchScore;
  if (profile && minimumMatchScore != null)
    items = items.filter(
      (o) => calculateOpportunityMatch(profile, o).score >= minimumMatchScore,
    );
  if (profile) items.sort((a, b) => calculateOpportunityMatch(profile, b).score - calculateOpportunityMatch(profile, a).score);
  return NextResponse.json({
    intent: expandedIntent,
    items: items.slice(0, AI_PREVIEW_LIMIT),
    total: result.total,
    viewAllQuery: serializeSearchIntent(expandedIntent),
    fallbackApplied,
    mixedCurrencies: !expandedIntent.currency && new Set(items.map((item) => item.currency).filter(Boolean)).size > 1,
    health: result.health,
    error: result.error,
  });
}
