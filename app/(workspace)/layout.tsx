import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SupabaseSetup } from "@/components/supabase-setup";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getCompanyProfile } from "@/lib/repositories/company";
import { serverLog } from "@/lib/monitoring/logger";
export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { client, user } = await getAuthenticatedUser();
  if (!client) return <SupabaseSetup />;
  if (!user) redirect("/login");
  const profile = await getCompanyProfile(client, user.id).catch((error) => {
    serverLog("warn", "workspace_profile_load_failed", {
      error: error instanceof Error ? error.message : "Unknown profile error",
    });
    return null;
  });
  return (
    <AppShell profile={profile} email={user.email ?? "Account"}>
      {children}
    </AppShell>
  );
}
