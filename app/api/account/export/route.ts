import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getCompanyProfile } from "@/lib/repositories/company";
import { listSaved } from "@/lib/repositories/saved";
import { listActiveBidWorkspaces } from "@/lib/repositories/bid-workspace";
export async function GET() {
  const { client, user } = await getAuthenticatedUser();
  if (!client || !user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [company, saved, workspaces] = await Promise.all([
    getCompanyProfile(client, user.id),
    listSaved(client, user.id),
    listActiveBidWorkspaces(client, user.id),
  ]);
  return new NextResponse(
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        company,
        savedOpportunities: saved,
        bidWorkspaces: workspaces,
      },
      null,
      2,
    ),
    {
      headers: {
        "content-type": "application/json",
        "content-disposition": "attachment; filename=ipo-workspace-export.json",
      },
    },
  );
}
