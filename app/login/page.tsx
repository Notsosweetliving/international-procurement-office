import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getAuthenticatedUser } from "@/lib/supabase/server";
export default async function Login() {
  const { user } = await getAuthenticatedUser();
  if (user) redirect("/dashboard");
  return <AuthForm mode="login" />;
}
