import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getAuthenticatedUser } from "@/lib/supabase/server";
export default async function Login(props: PageProps<"/login">) {
  const [{ user }, params] = await Promise.all([
    getAuthenticatedUser(),
    props.searchParams,
  ]);
  if (user) redirect("/dashboard");
  return (
    <AuthForm
      mode="login"
      initialError={
        params.auth === "session_refresh"
          ? "Your session could not be verified. Please sign in again."
          : undefined
      }
    />
  );
}
