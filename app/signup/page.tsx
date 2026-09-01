import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getAuthenticatedUser } from "@/lib/supabase/server";
export default async function Signup() {
  const { user } = await getAuthenticatedUser();
  if (user) redirect("/onboarding");
  return (
    <AuthForm
      mode="signup"
      betaInviteRequired={process.env.BETA_ACCESS_MODE === "true"}
    />
  );
}
