"use client";
import Link from "next/link";
import { useActionState } from "react";
import { signIn, signUp, type AuthState } from "@/app/auth-actions";
import { Brand } from "./app-shell";
export function AuthForm({
  mode,
  betaInviteRequired = false,
  initialError,
}: {
  mode: "login" | "signup";
  betaInviteRequired?: boolean;
  initialError?: string;
}) {
  const action = mode === "login" ? signIn : signUp;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    {},
  );
  return (
    <main className="auth-page">
      <div className="auth-card">
        <Brand />
        <span className="section-label">PRIVATE PROCUREMENT WORKSPACE</span>
        <h1>{mode === "login" ? "Welcome back" : "Create your workspace"}</h1>
        <p>
          {mode === "login"
            ? "Sign in to access your profile, saved opportunities and tender analyses."
            : "Start a secure International Procurement Office workspace for your company."}
        </p>
        <form action={formAction}>
          <label>
            Email address
            <input name="email" type="email" autoComplete="email" required />
          </label>
          {mode === "signup" && betaInviteRequired ? (
            <label>
              Beta invitation code
              <input name="inviteCode" autoComplete="off" required />
            </label>
          ) : null}
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              minLength={mode === "login" ? 6 : 8}
              required
            />
          </label>
          {state.error || initialError ? (
            <div className="auth-error">{state.error ?? initialError}</div>
          ) : null}
          {state.message ? (
            <div className="auth-success">{state.message}</div>
          ) : null}
          <button className="black-button" disabled={pending}>
            {pending
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>
        <small>
          {mode === "login" ? (
            <>
              New to IPO? <Link href="/signup">Create an account</Link>
            </>
          ) : (
            <>
              Already have an account? <Link href="/login">Sign in</Link>
            </>
          )}
        </small>
      </div>
    </main>
  );
}
