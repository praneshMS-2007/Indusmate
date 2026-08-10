import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const sessionToken =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    req.cookies.get("next-auth.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value;

  const hasSession = !!sessionToken;
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isPublicApi = pathname.startsWith("/api/auth");
  const isStaticAsset = pathname.includes(".") || pathname.startsWith("/_next");

  // Allow static assets (like /logo.png, /login-bg.png, etc.) to load freely
  if (isStaticAsset) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users away from protected routes
  if (!hasSession && !isAuthPage && !isPublicApi) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Redirect authenticated users away from login/signup
  if (hasSession && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
