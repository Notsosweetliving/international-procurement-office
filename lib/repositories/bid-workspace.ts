import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/database.types.ts";
import type { Opportunity } from "../opportunities/types.ts";
import type {
  ComplianceStatus,
  RequirementLike,
} from "../bid-workspace/types.ts";
import { calculateBidReadiness } from "../bid-workspace/readiness.ts";
import { saveOpportunity } from "./saved.ts";
const isMissingV07Schema = (error: { code?: string; message?: string }) =>
  error.code === "42P01" ||
  error.code === "PGRST205" ||
  /bid_workspaces.*schema cache|relation .*bid_workspaces.* does not exist/i.test(
    error.message ?? "",
  );
export async function ensureBidWorkspace(
  db: SupabaseClient<Database>,
  userId: string,
  o: Opportunity,
) {
  await saveOpportunity(db, userId, o);
  const { data, error } = await db
    .from("bid_workspaces")
    .upsert(
      {
        user_id: userId,
        source: o.source ?? "TED",
        source_opportunity_id: o.id,
      },
      { onConflict: "user_id,source,source_opportunity_id" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
export async function getBidWorkspace(
  db: SupabaseClient<Database>,
  userId: string,
  opportunityId: string,
) {
  const { data: workspace, error } = await db
    .from("bid_workspaces")
    .select("*")
    .eq("user_id", userId)
    .eq("source_opportunity_id", opportunityId)
    .maybeSingle();
  if (error) {
    if (isMissingV07Schema(error)) return null;
    throw error;
  }
  if (!workspace) return null;
  const [documents, requirements, compliance, checklist] = await Promise.all([
    db
      .from("tender_documents")
      .select("*")
      .eq("user_id", userId)
      .eq("source_opportunity_id", opportunityId)
      .order("created_at"),
    db
      .from("tender_requirements")
      .select("*")
      .eq("user_id", userId)
      .eq("source_opportunity_id", opportunityId)
      .order("created_at"),
    db
      .from("compliance_items")
      .select("*")
      .eq("bid_workspace_id", workspace.id),
    db
      .from("bid_submission_items")
      .select("*")
      .eq("bid_workspace_id", workspace.id)
      .order("created_at"),
  ]);
  for (const result of [documents, requirements, compliance, checklist])
    if (result.error) throw result.error;
  return {
    workspace,
    documents: documents.data ?? [],
    requirements: requirements.data ?? [],
    compliance: compliance.data ?? [],
    checklist: checklist.data ?? [],
  };
}
export async function listActiveBidWorkspaces(
  db: SupabaseClient<Database>,
  userId: string,
) {
  const { data, error } = await db
    .from("bid_workspaces")
    .select("*")
    .eq("user_id", userId)
    .neq("decision", "do_not_bid")
    .order("updated_at", { ascending: false })
    .limit(5);
  if (error) {
    if (isMissingV07Schema(error)) return [];
    throw error;
  }
  return data ?? [];
}
export async function getBidDocumentContext(
  db: SupabaseClient<Database>,
  userId: string,
  opportunityId: string,
) {
  const workspace = await getBidWorkspace(db, userId, opportunityId);
  if (!workspace) return null;
  const ids = workspace.documents.map((x) => x.id);
  const { data: extractions, error } = ids.length
    ? await db
        .from("tender_document_extractions")
        .select("document_id,extraction_text,extraction_metadata")
        .in("document_id", ids)
    : { data: [], error: null };
  if (error) throw error;
  return {
    requirements: workspace.requirements.map((r) => ({
      title: r.title,
      description: r.description,
      type: r.requirement_type,
      mandatory: r.mandatory_status,
      confidence: r.confidence,
      sourceReference: r.source_reference,
      sourceDocumentId: r.source_document_id,
    })),
    compliance: workspace.compliance.map((c) => ({
      requirementId: c.requirement_id,
      status: c.status,
      evidenceDocumentId: c.evidence_document_id,
      userNote: c.user_note,
    })),
    checklist: workspace.checklist.map((c) => ({
      label: c.label,
      completed: c.completed,
      category: c.category,
    })),
    documents: workspace.documents.map((d) => ({
      id: d.id,
      filename: d.filename,
      status: d.processing_status,
      text:
        (extractions ?? [])
          .find((x) => x.document_id === d.id)
          ?.extraction_text.slice(0, 6000) ?? "",
    })),
  };
}
export async function recalculateBidWorkspace(
  db: SupabaseClient<Database>,
  userId: string,
  opportunityId: string,
  deadline: string | null,
) {
  const data = await getBidWorkspace(db, userId, opportunityId);
  if (!data) return null;
  const daysRemaining = deadline
    ? Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
    : null;
  const result = calculateBidReadiness({
    items: data.requirements.map((r) => {
      const c = data.compliance.find((x) => x.requirement_id === r.id);
      return {
        requirement: {
          title: r.title,
          description: r.description,
          requirementType: r.requirement_type,
          mandatoryStatus: r.mandatory_status,
          confidence: r.confidence,
        } as RequirementLike,
        status: (c?.status ?? "needs_review") as ComplianceStatus,
        evidenceAvailable: Boolean(c?.evidence_document_id),
      };
    }),
    submissionCompleted: data.checklist.filter((x) => x.completed).length,
    submissionTotal: data.checklist.length,
    daysRemaining,
  });
  await db
    .from("bid_workspaces")
    .update({ readiness_score: result.score })
    .eq("id", data.workspace.id)
    .eq("user_id", userId);
  return result;
}
