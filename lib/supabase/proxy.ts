import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";
import { isSupabaseConfigured } from "./config";
import { serverLog } from "@/lib/monitoring/logger";
export async function refreshSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!isSupabaseConfigured())
    return { response, user: null, configured: false, sessionError: false };
  const client = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values) {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );
  try {
    const {
      data: { user },
    } = await client.auth.getUser();
    return { response, user, configured: true, sessionError: false };
  } catch (error) {
    serverLog("warn", "auth_session_refresh_failed", {
      error: error instanceof Error ? error.message : "Unknown auth error",
      path: request.nextUrl.pathname,
    });
    return { response, user: null, configured: true, sessionError: true };
  }
}
