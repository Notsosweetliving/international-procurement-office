import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getCompanyProfile } from "@/lib/repositories/company";
import { OnboardingFlow } from "@/components/onboarding-flow";
export default async function Onboarding() {
  const { client, user } = await getAuthenticatedUser();
  if (!client || !user) redirect("/login");
  return <OnboardingFlow initial={await getCompanyProfile(client, user.id)} />;
}
