import { NextRequest, NextResponse } from "next/server";

/**
 * Route prefixes that require an authenticated session.
 * Extend this list as protected pages (e.g. /profile, /orders) are built.
 */
const PROTECTED_ROUTES: string[] = ["/checkout", "/orders", "/inbox", "/admin", "/account"];

/** Auth routes a logged-in user shouldn't need to see again. */
const AUTH_ROUTES = ["/login", "/signup", "/forgot-password"];

const SELLER_PROTECTED_ROUTES: string[] = ["/seller/dashboard"];
const SELLER_AUTH_PATHS = ["/seller", "/seller/login"];

function hasSellerSession(request: NextRequest): boolean {
  return Boolean(request.cookies.get("seller_token")?.value);
}

function hasSession(request: NextRequest): boolean {
  // accessToken/refreshToken are httpOnly but still readable server-side
  // via the request's cookie header. refreshToken is checked too since it
  // outlives the access token and the client can silently re-mint one.
  return Boolean(
    request.cookies.get("accessToken")?.value || request.cookies.get("refreshToken")?.value
  );
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const authenticated = hasSession(request);

  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  const sellerAuthenticated = hasSellerSession(request);

  const isSellerProtectedRoute = SELLER_PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isSellerAuthPath = SELLER_AUTH_PATHS.includes(pathname);

  if (isSellerProtectedRoute && !sellerAuthenticated) {
    const loginUrl = new URL("/seller/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isSellerAuthPath && sellerAuthenticated && !searchParams.has("redirect")) {
    return NextResponse.redirect(new URL("/seller/dashboard", request.url));
  }

  if (isProtectedRoute && !authenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // A `redirect` param means the app itself sent the user here (e.g.
  // ProtectedRoute bouncing an invalidated session). Cookie presence alone
  // can't tell a live session from one invalidated server-side, so this
  // case is left to the client's real auth check instead of bouncing away
  // and trapping the user in a loop until the stale cookie expires.
  if (isAuthRoute && authenticated && !searchParams.has("redirect")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/signup",
    "/forgot-password",
    "/checkout",
    "/orders/:path*",
    "/inbox",
    "/account",
    "/seller",
    "/seller/login",
    "/seller/dashboard/:path*",
    "/admin/:path*",
  ],
};