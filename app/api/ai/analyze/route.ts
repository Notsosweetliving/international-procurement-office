import { NextResponse } from "next/server";
import { analysisRequestSchema } from "@/lib/ai/schemas";
import { allowAiRequest } from "@/lib/ai/rate-limit";
import { analyzeTender } from "@/lib/ai/tender-analysis";
import { AiUnavailableError, OPENAI_MODEL } from "@/lib/ai/client";
import { getCachedOpportunity } from "@/lib/opportunities/cache";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import {
  getPersistedAnalysis,
  persistAnalysis,
} from "@/lib/repositories/analysis";
import { serverEntitlement, recordServerEvent } from "@/lib/billing/server";
import { serverLog } from "@/lib/monitoring/logger";
import { publicAiErrorMessage, safeAiError } from "@/lib/ai/errors";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  const started = Date.now();
  let opportunityId = "unknown";
  const log = (stage: string, extra: Record<string, unknown> = {}) => serverLog(stage === "analysis_failed" ? "error" : "info", stage, { stage, opportunity_id: opportunityId, model: OPENAI_MODEL, duration_ms: Date.now() - started, ...extra });
  log("analysis_started");
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
    log("analysis_authenticated");
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
    opportunityId = parsed.data.opportunityId;
    const opportunity = await getCachedOpportunity(client, opportunityId);
    if (!opportunity)
      return NextResponse.json(
        { error: "Opportunity not found." },
        { status: 404 },
      );
    log("analysis_opportunity_loaded");
    const persisted = await getPersistedAnalysis(
      client,
      user.id,
      opportunity.source,
      opportunity.id,
      opportunity.publishedAt,
    );
    log("analysis_cached_result_checked", { cached: Boolean(persisted) });
    if (persisted)
      return NextResponse.json({ analysis: persisted, cached: true });
    log("analysis_openai_started");
    const analysis = await analyzeTender(opportunity);
    log("analysis_openai_completed");
    log("analysis_validation_completed");
    try {
      await persistAnalysis(client, user.id, opportunity.source, opportunity.id, opportunity.publishedAt, OPENAI_MODEL, analysis);
      await recordServerEvent(user.id, "ai_analysis", "analysis_created");
      log("analysis_persisted");
    } catch {
      log("analysis_failed", { error_type: "persistence_failed", safe_error_message: "Valid analysis could not be saved." });
      return NextResponse.json({ analysis, cached: false, warning: "Analysis is ready, but could not be saved for later." });
    }
    return NextResponse.json({ analysis, cached: false });
  } catch (error) {
    if (error instanceof AiUnavailableError) {
      log("analysis_failed", { error_type: "not_configured", safe_error_message: error.message });
      return NextResponse.json(
        { error: error.message, code: "AI_UNAVAILABLE" },
        { status: 503 },
      );
    }
    const safe = safeAiError(error);
    log("analysis_failed", { error_type: safe.type, safe_error_message: safe.message, upstream_http_status: safe.status });
    return NextResponse.json(
      { error: publicAiErrorMessage(safe), code: safe.type },
      { status: safe.status === 429 ? 503 : 502 },
    );
  }
}
