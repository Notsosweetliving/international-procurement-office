import { NextResponse } from "next/server";
import { chatRequestSchema } from "@/lib/ai/schemas";
import { allowAiRequest } from "@/lib/ai/rate-limit";
import { askOpportunity } from "@/lib/ai/opportunity-chat";
import { AiUnavailableError } from "@/lib/ai/client";
import { opportunityService } from "@/lib/opportunities/service";
import { calculateOpportunityMatch } from "@/lib/matching/engine";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getCompanyProfile } from "@/lib/repositories/company";
import { getPersistedAnalysis } from "@/lib/repositories/analysis";
import { getBidDocumentContext } from "@/lib/repositories/bid-workspace";
import { supplierWorkspaceContext } from "@/lib/suppliers/repository";
export async function POST(request: Request) {
  if (!allowAiRequest("chat", 12))
    return NextResponse.json(
      { error: "Too many questions. Try again shortly." },
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
    const parsed = chatRequestSchema.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        { error: "Question must be between 2 and 500 characters." },
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
    const [profile, analysis, bidContext, supplierContext] = await Promise.all([
      getCompanyProfile(client, user.id),
      getPersistedAnalysis(
        client,
        user.id,
        opportunity.source,
        opportunity.id,
        opportunity.publishedAt,
      ),
      getBidDocumentContext(client, user.id, opportunity.id),
      supplierWorkspaceContext(client, user.id, opportunity.id).catch(
        () => null,
      ),
    ]);
    const match = profile
      ? calculateOpportunityMatch(profile, opportunity)
      : null;
    return NextResponse.json({
      answer: await askOpportunity(
        parsed.data.question,
        opportunity,
        profile,
        match,
        analysis ?? undefined,
        { documents: bidContext, suppliers: supplierContext },
      ),
    });
  } catch (error) {
    if (error instanceof AiUnavailableError)
      return NextResponse.json(
        { error: error.message, code: "AI_UNAVAILABLE" },
        { status: 503 },
      );
    return NextResponse.json(
      { error: "IPO could not answer that question." },
      { status: 502 },
    );
  }
}
