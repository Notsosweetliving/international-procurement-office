import type { IngestionSource } from "./types";

const integer = (value: string | undefined, fallback: number, max: number) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(1, parsed)) : fallback;
};
export const samSyncEnabled = () => process.env.SAM_SYNC_ENABLED?.trim().toLowerCase() === "true";
export const samSyncMaxRequests = () => integer(process.env.SAM_SYNC_MAX_REQUESTS_PER_RUN, 1, 5);
export const samSyncLookbackDays = () => integer(process.env.SAM_SYNC_LOOKBACK_DAYS, 30, 365);
export const providerMaxRequests = (source: IngestionSource) => source === "SAM" ? samSyncMaxRequests() : source === "UK" ? 1 : integer(process.env.PROCUREMENT_SYNC_MAX_REQUESTS_PER_RUN, 2, 5);
