export interface BetaInvite {
  email: string | null;
  code: string;
  maxUses: number;
  uses: number;
  expiresAt: string | null;
}
export function validateBetaInvite(
  invite: BetaInvite | null,
  code: string,
  email: string,
  now = new Date(),
) {
  if (process.env.BETA_ACCESS_MODE !== "true")
    return { valid: true, reason: "open_signup" };
  if (!invite || invite.code !== code)
    return { valid: false, reason: "invalid" };
  if (invite.expiresAt && new Date(invite.expiresAt) <= now)
    return { valid: false, reason: "expired" };
  if (invite.uses >= invite.maxUses)
    return { valid: false, reason: "exhausted" };
  if (invite.email && invite.email.toLowerCase() !== email.toLowerCase())
    return { valid: false, reason: "email_mismatch" };
  return { valid: true, reason: "accepted" };
}
