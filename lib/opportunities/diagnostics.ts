import { createClient } from "@supabase/supabase-js";
import { serverLog } from "../monitoring/logger.ts";
import type { OpportunitySource } from "./types";
import type { ProviderDiagnostic } from "./providers/types";

type Provider = Exclude<OpportunitySource, "mock">;
type Fetcher = (
  input: string,
  init?: RequestInit & { next?: { revalidate: number } },
) => Promise<Response>;

export interface ProviderRequestContext {
  provider: Provider;
  upstreamUrl: string;
  upstreamStatus: number;
  startedAt: number;
  checkedAt: string;
  configured: boolean;
}

export class ProviderRequestError extends Error {
  readonly diagnostic: ProviderDiagnostic;
  constructor(message: string, diagnostic: ProviderDiagnostic) {
    super(message);
    this.diagnostic = diagnostic;
  }
}

export function safeUpstreamUrl(value: string) {
  try {
    const url = new URL(value);
    for (const key of [...url.searchParams.keys()]) {
      if (/key|token|secret|auth/i.test(key)) url.searchParams.set(key, "[redacted]");
    }
    return url.toString();
  } catch {
    return "invalid-upstream-url";
  }
}

export function providerConfiguration() {
  return {
    TED: true,
    UK: true,
    SAM: Boolean(process.env.SAM_API_KEY?.trim()),
    NATO: Boolean(process.env.NATO_OPPORTUNITIES_URL?.trim()),
    TED_API_BASE_URL: Boolean(process.env.TED_API_BASE_URL?.trim()),
    UK_FTS_API_BASE_URL: Boolean(process.env.UK_FTS_API_BASE_URL?.trim()),
    SAM_API_BASE_URL: Boolean(process.env.SAM_API_BASE_URL?.trim()),
    NATO_OPPORTUNITIES_URL: Boolean(process.env.NATO_OPPORTUNITIES_URL?.trim()),
    SAM_API_KEY: Boolean(process.env.SAM_API_KEY?.trim()),
  };
}

export async function fetchProviderJson(
  provider: Provider,
  upstreamUrl: string,
  init: RequestInit & { next?: { revalidate: number } },
  options: {
    fetcher?: Fetcher;
    safeError: (status?: number) => string;
    configured?: boolean;
  },
): Promise<{ data: unknown; context: ProviderRequestContext }> {
  const startedAt = Date.now();
  const checkedAt = new Date().toISOString();
  const safeUrl = safeUpstreamUrl(upstreamUrl);
  serverLog("info", "provider_request_started", {
    provider,
    request_started: true,
    upstream_url: safeUrl,
    configured: options.configured ?? providerConfiguration()[provider],
    ...providerConfigurationFlags(provider),
  });
  let response: Response;
  try {
    response = await (options.fetcher ?? fetch)(upstreamUrl, init);
  } catch (error) {
    const timeout = isTimeout(error);
    const diagnostic = makeDiagnostic({
      provider,
      status: "failed",
      rawCount: 0,
      normalizedCount: 0,
      durationMs: Date.now() - startedAt,
      errorType: timeout ? "timeout" : "network_error",
      safeErrorMessage: timeout ? "The upstream request timed out." : options.safeError(),
      upstreamUrl: safeUrl,
      timeout,
      checkedAt,
      configured: options.configured ?? providerConfiguration()[provider],
    });
    await recordProviderDiagnostic(diagnostic);
    throw new ProviderRequestError(diagnostic.safeErrorMessage ?? "Provider request failed.", diagnostic);
  }
  const context: ProviderRequestContext = {
    provider,
    upstreamUrl: safeUrl,
    upstreamStatus: response.status,
    startedAt,
    checkedAt,
    configured: options.configured ?? providerConfiguration()[provider],
  };
  if (!response.ok) {
    const diagnostic = makeDiagnostic({
      provider,
      status: "failed",
      upstreamStatus: response.status,
      rawCount: 0,
      normalizedCount: 0,
      durationMs: Date.now() - startedAt,
      errorType: response.status === 429 ? "rate_limited" : "http_error",
      safeErrorMessage: options.safeError(response.status),
      upstreamUrl: safeUrl,
      timeout: false,
      checkedAt,
      configured: options.configured ?? providerConfiguration()[provider],
    });
    await recordProviderDiagnostic(diagnostic);
    throw new ProviderRequestError(diagnostic.safeErrorMessage ?? "Provider request failed.", diagnostic);
  }
  try {
    return { data: await response.json(), context };
  } catch {
    const diagnostic = makeDiagnostic({
      provider,
      status: "failed",
      upstreamStatus: response.status,
      rawCount: 0,
      normalizedCount: 0,
      durationMs: Date.now() - startedAt,
      errorType: "malformed_json",
      safeErrorMessage: `${provider} returned malformed JSON.`,
      upstreamUrl: safeUrl,
      timeout: false,
      checkedAt,
      configured: options.configured ?? providerConfiguration()[provider],
    });
    await recordProviderDiagnostic(diagnostic);
    throw new ProviderRequestError(diagnostic.safeErrorMessage ?? "Provider response was invalid.", diagnostic);
  }
}

export async function completeProviderRequest(
  context: ProviderRequestContext,
  rawCount: number,
  normalizedCount: number,
) {
  const normalizationFailed = rawCount > 0 && normalizedCount === 0;
  const diagnostic = makeDiagnostic({
    provider: context.provider,
    status: normalizationFailed ? "failed" : "ok",
    upstreamStatus: context.upstreamStatus,
    rawCount,
    normalizedCount,
    durationMs: Date.now() - context.startedAt,
    errorType: normalizationFailed ? "normalization_failure" : undefined,
    safeErrorMessage: normalizationFailed
      ? `${context.provider} returned records but none could be normalized.`
      : undefined,
    upstreamUrl: context.upstreamUrl,
    timeout: false,
    checkedAt: context.checkedAt,
    configured: context.configured,
  });
  await recordProviderDiagnostic(diagnostic);
  return diagnostic;
}

export async function unconfiguredProviderDiagnostic(provider: Provider) {
  const diagnostic = makeDiagnostic({
    provider,
    status: "failed",
    rawCount: 0,
    normalizedCount: 0,
    durationMs: 0,
    errorType: "not_configured",
    safeErrorMessage: `${provider} is not configured.`,
    upstreamUrl: "not-configured",
    timeout: false,
    checkedAt: new Date().toISOString(),
    configured: false,
  });
  await recordProviderDiagnostic(diagnostic);
  return diagnostic;
}

export async function getLastProviderDiagnostics() {
  const db = diagnosticsClient();
  if (!db) return [] as ProviderDiagnostic[];
  const { data, error } = await db.from("provider_diagnostics").select("*");
  if (error || !data) return [] as ProviderDiagnostic[];
  return data.map((row: Record<string, unknown>) => ({
    provider: row.provider as Provider,
    configured: Boolean(row.configured),
    status: row.status as "ok" | "failed",
    upstreamStatus: typeof row.upstream_status === "number" ? row.upstream_status : undefined,
    rawCount: Number(row.raw_result_count ?? 0),
    normalizedCount: Number(row.normalized_result_count ?? 0),
    resultCount: Number(row.result_count ?? 0),
    durationMs: Number(row.duration_ms ?? 0),
    errorType: typeof row.error_type === "string" ? row.error_type : undefined,
    safeErrorMessage: typeof row.safe_error_message === "string" ? row.safe_error_message : undefined,
    upstreamUrl: typeof row.upstream_url === "string" ? row.upstream_url : "",
    timeout: Boolean(row.timeout),
    checkedAt: String(row.checked_at),
  }));
}

export async function recordNormalizationFailureForTest(
  context: ProviderRequestContext,
  rawCount: number,
) {
  return completeProviderRequest(context, rawCount, 0);
}

function makeDiagnostic(
  value: Omit<ProviderDiagnostic, "resultCount"> & { resultCount?: number },
): ProviderDiagnostic {
  return { ...value, resultCount: value.resultCount ?? value.normalizedCount };
}

async function recordProviderDiagnostic(diagnostic: ProviderDiagnostic) {
  serverLog(diagnostic.status === "ok" ? "info" : "warn", diagnostic.status === "ok" ? "provider_request_completed" : "provider_request_failed", {
    provider: diagnostic.provider,
    request_completed: true,
    status: diagnostic.status,
    result_count: diagnostic.resultCount,
    raw_result_count: diagnostic.rawCount,
    normalized_result_count: diagnostic.normalizedCount,
    duration_ms: diagnostic.durationMs,
    error_type: diagnostic.errorType,
    safe_error_message: diagnostic.safeErrorMessage,
    upstream_http_status: diagnostic.upstreamStatus,
    upstream_url: diagnostic.upstreamUrl,
    timeout: diagnostic.timeout,
  });
  const db = diagnosticsClient();
  if (!db) return;
  const { error } = await db.from("provider_diagnostics").upsert(
    {
      provider: diagnostic.provider,
      configured: diagnostic.configured,
      status: diagnostic.status,
      upstream_status: diagnostic.upstreamStatus ?? null,
      raw_result_count: diagnostic.rawCount,
      normalized_result_count: diagnostic.normalizedCount,
      result_count: diagnostic.resultCount,
      duration_ms: diagnostic.durationMs,
      error_type: diagnostic.errorType ?? null,
      safe_error_message: diagnostic.safeErrorMessage ?? null,
      upstream_url: diagnostic.upstreamUrl,
      timeout: diagnostic.timeout,
      checked_at: diagnostic.checkedAt,
    },
    { onConflict: "provider" },
  );
  if (error) serverLog("warn", "provider_diagnostic_persist_failed", { provider: diagnostic.provider, error: error.message });
}

function diagnosticsClient() {
  if (process.env.NODE_ENV === "test" || process.env.NODE_TEST_CONTEXT) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key
    ? createClient(url, key, { auth: { persistSession: false } })
    : null;
}

function isTimeout(error: unknown) {
  return error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
}

function providerConfigurationFlags(provider: Provider) {
  const status = providerConfiguration();
  if (provider === "TED")
    return { ted_api_base_url_configured: status.TED_API_BASE_URL };
  if (provider === "UK")
    return { uk_fts_api_base_url_configured: status.UK_FTS_API_BASE_URL };
  if (provider === "SAM")
    return {
      sam_api_base_url_configured: status.SAM_API_BASE_URL,
      sam_api_key_configured: status.SAM_API_KEY,
    };
  return { nato_opportunities_url_configured: status.NATO_OPPORTUNITIES_URL };
}
