export function notificationDedupeKey(
  kind: string,
  userId: string,
  recordId: string,
  period: string,
) {
  return [kind, userId, recordId, period].join(":");
}
export function shouldGenerateAlert(
  frequency: "off" | "daily" | "weekly",
  last: string | null,
  now = new Date(),
) {
  if (frequency === "off") return false;
  if (!last) return true;
  const elapsed = now.getTime() - new Date(last).getTime();
  return elapsed >= (frequency === "daily" ? 86400000 : 604800000);
}
