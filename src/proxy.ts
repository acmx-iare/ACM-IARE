import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("acm_admin_session");
  const isAuthenticated = Boolean(sessionCookie && sessionCookie.value);

  // Public admin auth paths that do not require login
  const isPublicAuthPath =
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/admin/forgot-password") ||
    pathname.startsWith("/admin/reset-password");

  const isAdminPath = pathname.startsWith("/admin");
  const isStudioPath = pathname.startsWith("/studio");

  // If trying to access protected /admin or /studio without a session, redirect to login
  if ((isAdminPath || isStudioPath) && !isPublicAuthPath && !isAuthenticated) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If already authenticated and visiting login page, redirect to admin console
  if (pathname === "/admin/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-admin-path", pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/studio",
    "/studio/:path*",
  ],
};
