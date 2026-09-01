import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { isSupabaseConfigured } from "./config";
import { serverLog } from "@/lib/monitoring/logger";
export async function createClient() {
  if (!isSupabaseConfigured()) return null;
  const store = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll(values) {
          try {
            values.forEach(({ name, value, options }) =>
              store.set(name, value, options),
            );
          } catch {}
        },
      },
    },
  );
}
export async function getAuthenticatedUser() {
  const client = await createClient();
  if (!client) return { client: null, user: null, sessionError: false };
  try {
    const {
      data: { user },
    } = await client.auth.getUser();
    return { client, user, sessionError: false };
  } catch (error) {
    serverLog("warn", "auth_user_lookup_failed", {
      error: error instanceof Error ? error.message : "Unknown auth error",
    });
    return { client, user: null, sessionError: true };
  }
}
