import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Supabase client for use in Server Components, Server Actions and Route
 * Handlers. Reads/writes the auth cookies via Next's async cookie store.
 *
 * Writes from a Server Component throw (cookies are read-only there); those are
 * swallowed because the middleware refreshes the session on every request.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — safe to ignore, middleware
            // refreshes the session cookie.
          }
        },
      },
    },
  );
}
