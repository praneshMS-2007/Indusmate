import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

export async function middleware(req: NextRequest) {
  const session = await auth();
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
  
  // If user is logged in and tries to access login/signup, redirect to home
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (session && !(session.user as any).orgId) {
    if (!pathname.startsWith("/welcome") && !pathname.startsWith("/onboarding") && !isAuthPage && !pathname.startsWith("/api") && !pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/welcome", req.url));
    }
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
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
