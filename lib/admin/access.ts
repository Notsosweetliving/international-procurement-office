export function adminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean),
  );
}
export function isAdminEmail(email: string | null | undefined) {
  return Boolean(email && adminEmails().has(email.toLowerCase()));
}
export const canAccessProviderDiagnostics = isAdminEmail;
