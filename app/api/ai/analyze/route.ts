import { NextResponse } from "next/server";
import { analysisRequestSchema } from "@/lib/ai/schemas";
import { allowAiRequest } from "@/lib/ai/rate-limit";
import { analyzeTender } from "@/lib/ai/tender-analysis";
import { AiUnavailableError, OPENAI_MODEL } from "@/lib/ai/client";
import { opportunityService } from "@/lib/opportunities/service";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import {
  getPersistedAnalysis,
  persistAnalysis,
} from "@/lib/repositories/analysis";
import { serverEntitlement, recordServerEvent } from "@/lib/billing/server";
export async function POST(request: Request) {
  if (!allowAiRequest("analysis", 6))
    return NextResponse.json(
      { error: "Too many analysis requests. Try again shortly." },
      { status: 429 },
    );
  try {
    const { client, user } = await getAuthenticatedUser();
    if (!client)
      return NextResponse.json(
        { error: "Supabase is not configured." },
        { status: 503 },
      );
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const access = await serverEntitlement(
      client,
      user.id,
      "ai_analysis",
    ).catch(() => ({ allowed: true }));
    if (!access.allowed)
      return NextResponse.json(
        { error: "Monthly AI analysis limit reached." },
        { status: 403 },
      );
    const parsed = analysisRequestSchema.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        { error: "Invalid analysis request." },
        { status: 400 },
      );
    const opportunity = await opportunityService.getById(
      parsed.data.opportunityId,
    );
    if (!opportunity)
      return NextResponse.json(
        { error: "Opportunity not found." },
        { status: 404 },
      );
    const persisted = await getPersistedAnalysis(
      client,
      user.id,
      opportunity.source,
      opportunity.id,
      opportunity.publishedAt,
    );
    if (persisted)
      return NextResponse.json({ analysis: persisted, cached: true });
    const analysis = await analyzeTender(opportunity);
    await persistAnalysis(
      client,
      user.id,
      opportunity.source,
      opportunity.id,
      opportunity.publishedAt,
      OPENAI_MODEL,
      analysis,
    );
    await recordServerEvent(user.id, "ai_analysis", "analysis_created");
    return NextResponse.json({ analysis, cached: false });
  } catch (error) {
    if (error instanceof AiUnavailableError)
      return NextResponse.json(
        { error: error.message, code: "AI_UNAVAILABLE" },
        { status: 503 },
      );
    return NextResponse.json(
      { error: "AI analysis could not be generated. Try again shortly." },
      { status: 502 },
    );
  }
}
