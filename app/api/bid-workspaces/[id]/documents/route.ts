import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { opportunityService } from "@/lib/opportunities/service";
import {
  ensureBidWorkspace,
  recalculateBidWorkspace,
} from "@/lib/repositories/bid-workspace";
import {
  validateTenderFile,
  privateStoragePath,
} from "@/lib/documents/validation";
import { extractTenderDocument } from "@/lib/documents/extract";
import { extractTenderRequirements } from "@/lib/ai/document-requirements";
import { isAiAvailable } from "@/lib/ai/client";
import { getCompanyProfile } from "@/lib/repositories/company";
import { suggestCompliance } from "@/lib/bid-workspace/compliance";
import type { RequirementLike } from "@/lib/bid-workspace/types";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(
  request: Request,
  { params }: RouteContext<"/api/bid-workspaces/[id]/documents">,
) {
  const { id } = await params,
    { client, user } = await getAuthenticatedUser();
  if (!client)
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const opportunity = await opportunityService.getById(id);
  if (!opportunity)
    return NextResponse.json(
      { error: "Opportunity not found." },
      { status: 404 },
    );
  const form = await request.formData(),
    value = form.get("file");
  if (!(value instanceof File))
    return NextResponse.json(
      { error: "Select a tender document." },
      { status: 400 },
    );
  const buffer = Buffer.from(await value.arrayBuffer()),
    validation = validateTenderFile(value.name, value.size, value.type, buffer);
  if (!validation.ok)
    return NextResponse.json({ error: validation.error }, { status: 400 });
  const workspace = await ensureBidWorkspace(client, user.id, opportunity),
    documentId = crypto.randomUUID(),
    storagePath = privateStoragePath(
      user.id,
      opportunity.source ?? "TED",
      opportunity.id,
      validation.filename,
      documentId,
    );
  const upload = await client.storage
    .from("tender-documents")
    .upload(storagePath, buffer, {
      contentType: validation.mimeType,
      upsert: false,
    });
  if (upload.error)
    return NextResponse.json(
      { error: "Private document upload failed." },
      { status: 502 },
    );
  const inserted = await client
    .from("tender_documents")
    .insert({
      id: documentId,
      user_id: user.id,
      source: opportunity.source ?? "TED",
      source_opportunity_id: opportunity.id,
      filename: validation.filename,
      storage_path: storagePath,
      mime_type: validation.mimeType,
      file_size: value.size,
      processing_status: "processing",
    })
    .select("*")
    .single();
  if (inserted.error) {
    await client.storage.from("tender-documents").remove([storagePath]);
    return NextResponse.json(
      { error: "Document metadata could not be saved." },
      { status: 500 },
    );
  }
  try {
    const extracted = await extractTenderDocument(buffer, validation.mimeType);
    await client.from("tender_document_extractions").insert({
      document_id: documentId,
      extraction_text: extracted.text,
      extraction_metadata: extracted.metadata,
    });
    let aiWarning: string | undefined;
    if (extracted.text && isAiAvailable()) {
      try {
        const [analysis, profile] = await Promise.all([
          extractTenderRequirements(validation.filename, extracted.text),
          getCompanyProfile(client, user.id),
        ]);
        if (analysis.requirements.length) {
          const rows = analysis.requirements.map((r) => ({
            user_id: user.id,
            source: opportunity.source ?? "TED",
            source_opportunity_id: opportunity.id,
            requirement_type: r.category,
            title: r.title,
            description: r.description,
            source_document_id: documentId,
            source_reference: r.sourceReference,
            confidence: r.confidence,
            mandatory_status: r.mandatoryStatus,
          }));
          const { data: requirements, error } = await client
            .from("tender_requirements")
            .insert(rows)
            .select("*");
          if (error) throw error;
          const compliance = (requirements ?? []).map((r) => {
            const suggested = suggestCompliance(
              {
                title: r.title,
                description: r.description,
                requirementType: r.requirement_type,
                mandatoryStatus: r.mandatory_status,
                confidence: r.confidence,
              } as RequirementLike,
              profile,
            );
            return {
              bid_workspace_id: workspace.id,
              requirement_id: r.id,
              status: suggested.status,
              suggested_status: suggested.status,
            };
          });
          if (compliance.length)
            await client.from("compliance_items").insert(compliance);
          const checklist: {
            bid_workspace_id: string;
            label: string;
            category: string;
            source_requirement_id: string | null;
          }[] = (requirements ?? [])
            .filter(
              (r) =>
                r.requirement_type === "submission" ||
                r.requirement_type === "certification",
            )
            .map((r) => ({
              bid_workspace_id: workspace.id,
              label: r.title,
              category: r.requirement_type,
              source_requirement_id: r.id,
            }));
          checklist.push(
            ...analysis.documentsRequired.map((label) => ({
              bid_workspace_id: workspace.id,
              label,
              category: "submission",
              source_requirement_id: null,
            })),
          );
          if (checklist.length)
            await client.from("bid_submission_items").insert(checklist);
        }
      } catch {
        aiWarning =
          "Text was extracted, but structured requirement extraction could not be completed.";
      }
    } else if (!extracted.text)
      aiWarning = "Text could not be extracted automatically.";
    else
      aiWarning =
        "Text is ready. Configure AI to extract structured requirements.";
    await client
      .from("tender_documents")
      .update({
        processing_status: "ready",
        processing_error: aiWarning ?? null,
      })
      .eq("id", documentId)
      .eq("user_id", user.id);
    await recalculateBidWorkspace(
      client,
      user.id,
      opportunity.id,
      opportunity.deadline,
    );
    return NextResponse.json(
      {
        document: { ...inserted.data, processing_status: "ready" },
        warning: aiWarning,
      },
      { status: 201 },
    );
  } catch {
    await client
      .from("tender_documents")
      .update({
        processing_status: "failed",
        processing_error: "Text could not be extracted automatically.",
      })
      .eq("id", documentId)
      .eq("user_id", user.id);
    return NextResponse.json(
      { error: "Text could not be extracted automatically.", documentId },
      { status: 422 },
    );
  }
}
