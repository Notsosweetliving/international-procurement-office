import { NextResponse } from "next/server";
import { searchRequestSchema } from "@/lib/ai/schemas";
import { allowAiRequest } from "@/lib/ai/rate-limit";
import { parseSearchIntent } from "@/lib/ai/search-intent";
import { opportunityService } from "@/lib/opportunities/service";
import { calculateOpportunityMatch } from "@/lib/matching/engine";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getCompanyProfile } from "@/lib/repositories/company";
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
  const keyword =
    [...(intent.keywords ?? []), ...(intent.categories ?? [])].join(" ") ||
    parsed.data.query;
  const result = await opportunityService.search({
    query: keyword,
    sources: intent.sources,
    limit: 20,
  });
  const now = Date.now();
  let items = result.items.filter(
    (o) =>
      (intent.minValue == null ||
        o.value == null ||
        o.value >= intent.minValue) &&
      (intent.maxValue == null ||
        o.value == null ||
        o.value <= intent.maxValue) &&
      (!intent.currency || !o.currency || o.currency === intent.currency) &&
      (!intent.countries?.length ||
        intent.countries.some((c) =>
          o.country.toLowerCase().includes(c.toLowerCase()),
        )) &&
      (!intent.closingWithinDays ||
        !o.deadline ||
        (new Date(o.deadline).getTime() - now) / 86400000 <=
          intent.closingWithinDays),
  );
  const minimumMatchScore = intent.minimumMatchScore;
  if (profile && minimumMatchScore != null)
    items = items.filter(
      (o) => calculateOpportunityMatch(profile, o).score >= minimumMatchScore,
    );
  return NextResponse.json({
    intent,
    items: items.slice(0, 50),
    total: result.total,
    health: result.health,
    error: result.error,
  });
}
