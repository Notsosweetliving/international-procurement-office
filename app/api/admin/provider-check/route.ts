import { getAuthenticatedUser } from "@/lib/supabase/server";
import { canAccessProviderDiagnostics } from "@/lib/admin/access";
import {
  providerConfiguration,
  unconfiguredProviderDiagnostic,
} from "@/lib/opportunities/diagnostics";
import { providerRegistry } from "@/lib/opportunities/providers/registry";
import type { OpportunitySource } from "@/lib/opportunities/types";

export const runtime = "nodejs";

const PROVIDERS: Exclude<OpportunitySource, "mock">[] = [
  "TED",
  "UK",
  "SAM",
  "NATO",
];

export async function POST() {
  const { user } = await getAuthenticatedUser();
  if (!user || !canAccessProviderDiagnostics(user.email))
    return Response.json({ error: "Not authorized." }, { status: 403 });

  const configured = providerConfiguration();
  const entries = await Promise.all(
    PROVIDERS.map(async (provider) => {
      if (!configured[provider])
        return [provider.toLowerCase(), await unconfiguredProviderDiagnostic(provider)] as const;
      const result = await providerRegistry[provider].search({ limit: 2 });
      return [
        provider.toLowerCase(),
        result.diagnostic ?? {
          provider,
          configured: true,
          status: "failed",
          rawCount: 0,
          normalizedCount: 0,
          resultCount: 0,
          durationMs: 0,
          errorType: "missing_diagnostic",
          safeErrorMessage: result.error ?? "Provider did not return diagnostics.",
          upstreamUrl: "not-reported",
          timeout: false,
          checkedAt: new Date().toISOString(),
        },
      ] as const;
    }),
  );
  return Response.json(Object.fromEntries(entries), {
    headers: { "cache-control": "no-store" },
  });
}
