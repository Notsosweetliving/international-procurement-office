import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";
export async function GET(
  _: Request,
  { params }: RouteContext<"/api/bid-workspaces/[id]/documents/[documentId]">,
) {
  const { id, documentId } = await params,
    { client, user } = await getAuthenticatedUser();
  if (!client)
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: document, error } = await client
    .from("tender_documents")
    .select("storage_path")
    .eq("id", documentId)
    .eq("user_id", user.id)
    .eq("source_opportunity_id", id)
    .maybeSingle();
  if (error || !document)
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  const { data, error: signedError } = await client.storage
    .from("tender-documents")
    .createSignedUrl(document.storage_path, 300);
  if (signedError)
    return NextResponse.json(
      { error: "Document link could not be created." },
      { status: 500 },
    );
  return NextResponse.json({ url: data.signedUrl, expiresIn: 300 });
}
export async function DELETE(
  _: Request,
  { params }: RouteContext<"/api/bid-workspaces/[id]/documents/[documentId]">,
) {
  const { id, documentId } = await params;
  const { client, user } = await getAuthenticatedUser();
  if (!client) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: document, error } = await client.from("tender_documents").select("storage_path").eq("id", documentId).eq("user_id", user.id).eq("source_opportunity_id", id).maybeSingle();
  if (error || !document) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  const removed = await client.storage.from("tender-documents").remove([document.storage_path]);
  if (removed.error) return NextResponse.json({ error: "Document could not be removed. Please try again." }, { status: 502 });
  const deleted = await client.from("tender_documents").delete().eq("id", documentId).eq("user_id", user.id);
  if (deleted.error) return NextResponse.json({ error: "Document record could not be removed." }, { status: 500 });
  return NextResponse.json({ removed: true });
}
