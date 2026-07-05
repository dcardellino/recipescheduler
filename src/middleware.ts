import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: getUser() refreshes the session and must run before any redirect.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/invite");

  if (!user && !isAuthPage) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("next", pathname);
    return copyCookies(response, NextResponse.redirect(loginUrl));
  }

  if (user && isAuthPage) {
    return copyCookies(response, NextResponse.redirect(new URL("/recipes", request.url)));
  }

  return response;
}

/** Preserve refreshed Supabase auth cookies across a redirect response. */
function copyCookies(from: NextResponse, to: NextResponse): NextResponse {
  from.cookies.getAll().forEach((cookie) => to.cookies.set(cookie));
  return to;
}

export const config = {
  matcher: [
    // Match everything except: API routes (self-authorize), the auth callback,
    // Next internals and static assets.
    "/((?!api|auth/callback|_next|favicon.ico|manifest.json|icons|.*\\..*).*)",
  ],
};
