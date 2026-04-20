import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/invite");

  if (!sessionCookie && !isAuthPage) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (sessionCookie && isAuthPage) {
    return NextResponse.redirect(new URL("/recipes", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match everything except: Next internals, auth API, static assets, dev upload test page
    "/((?!api/auth|_next|favicon.ico|manifest.json|icons|.*\\..*).*)",
  ],
};
