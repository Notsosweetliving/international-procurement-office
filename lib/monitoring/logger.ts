type Level = "info" | "warn" | "error";
export function serverLog(
  level: Level,
  event: string,
  metadata: Record<string, unknown> = {},
) {
  const safe = Object.fromEntries(
    Object.entries(metadata).filter(
      ([k]) => !/token|secret|password|content|notes/i.test(k),
    ),
  );
  console[level](
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      event,
      ...safe,
    }),
  );
}
