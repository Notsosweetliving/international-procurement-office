import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SupabaseSetup } from "@/components/supabase-setup";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getCompanyProfile } from "@/lib/repositories/company";
export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { client, user } = await getAuthenticatedUser();
  if (!client) return <SupabaseSetup />;
  if (!user) redirect("/login");
  const profile = await getCompanyProfile(client, user.id);
  return (
    <AppShell profile={profile} email={user.email ?? "Account"}>
      {children}
    </AppShell>
  );
}
