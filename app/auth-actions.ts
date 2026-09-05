"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { validateBetaInvite } from "@/lib/beta/invites";
import { serverLog } from "@/lib/monitoring/logger";
export type AuthState = { error?: string; message?: string };
export async function signIn(_: AuthState, form: FormData): Promise<AuthState> {
  const db = await createClient();
  if (!db) return { error: "Supabase is not configured for this environment." };
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || password.length < 6)
    return {
      error: "Enter a valid email and a password of at least 6 characters.",
    };
  try {
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) {
      serverLog("warn", "auth_sign_in_rejected", { error: error.message });
      return { error: "Email or password is incorrect." };
    }
  } catch (error) {
    serverLog("error", "auth_sign_in_failed", {
      error: error instanceof Error ? error.message : "Unknown auth error",
    });
    return { error: "Sign in is temporarily unavailable. Please try again." };
  }
  redirect("/dashboard");
}
export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
  const db = await createClient();
  if (!db) return { error: "Supabase is not configured for this environment." };
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const inviteCode = String(form.get("inviteCode") ?? "").trim();
  const marketingOptIn = form.get("marketingOptIn") === "true";
  if (!email || password.length < 8)
    return {
      error: "Enter a valid email and a password of at least 8 characters.",
    };
  if (process.env.BETA_ACCESS_MODE === "true") {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key)
      return { error: "Private beta signup is not configured." };
    const admin = createAdminClient(url, key, {
      auth: { persistSession: false },
    });
    const { data: invite } = await admin
      .from("beta_invites")
      .select("*")
      .eq("code", inviteCode)
      .maybeSingle();
    const check = validateBetaInvite(
      invite
        ? {
            email: invite.email,
            code: invite.code,
            maxUses: invite.max_uses,
            uses: invite.uses,
            expiresAt: invite.expires_at,
          }
        : null,
      inviteCode,
      email,
    );
    if (!check.valid)
      return { error: `Invitation ${check.reason.replace("_", " ")}.` };
    const { data: consumed } = await admin
      .from("beta_invites")
      .update({ uses: invite.uses + 1 })
      .eq("id", invite.id)
      .eq("uses", invite.uses)
      .select("id")
      .maybeSingle();
    if (!consumed)
      return { error: "Invitation could not be consumed. Try again." };
  }
  let signup;
  try {
    signup = await db.auth.signUp({
      email,
      password,
      options: { data: { marketing_opt_in: marketingOptIn } },
    });
  } catch (error) {
    serverLog("error", "auth_sign_up_failed", {
      error: error instanceof Error ? error.message : "Unknown auth error",
    });
    return {
      error: "Account creation is temporarily unavailable. Please try again.",
    };
  }
  const { data, error } = signup;
  if (error) return { error: error.message };
  if (data.session) redirect("/onboarding");
  return { message: "Check your email to confirm your account, then sign in." };
}
export async function signOut() {
  const db = await createClient();
  if (db) {
    try {
      await db.auth.signOut();
    } catch (error) {
      serverLog("warn", "auth_sign_out_failed", {
        error: error instanceof Error ? error.message : "Unknown auth error",
      });
    }
  }
  redirect("/login");
}
