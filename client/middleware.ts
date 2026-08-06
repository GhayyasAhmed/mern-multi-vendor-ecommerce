import { NextRequest, NextResponse } from "next/server";

/**
 * Route prefixes that require an authenticated session.
 * Extend this list as protected pages (e.g. /profile, /orders) are built.
 */
const PROTECTED_ROUTES: string[] = [];

/** Auth routes a logged-in user shouldn't need to see again. */
const AUTH_ROUTES = ["/login", "/signup", "/forgot-password"];

function hasSession(request: NextRequest): boolean {
  // accessToken/refreshToken are httpOnly but still readable server-side
  // via the request's cookie header. refreshToken is checked too since it
  // outlives the access token and the client can silently re-mint one.
  return Boolean(
    request.cookies.get("accessToken")?.value || request.cookies.get("refreshToken")?.value
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authenticated = hasSession(request);

  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && !authenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && authenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
  matcher:  ["/login", "/signup", "/forgot-password"],
};