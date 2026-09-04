export function isCronAuthorized(request: Request, secret = process.env.CRON_SECRET) {
  const configured = secret?.trim();
  return Boolean(configured && request.headers.get("authorization") === `Bearer ${configured}`);
}
