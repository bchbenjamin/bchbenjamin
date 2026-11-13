import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/*
 * UX only. This checks that a session cookie exists; it does not validate it.
 * Every admin page, action and handler re-checks with requireOwner(), which is
 * the actual authorisation boundary.
 */
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();

  const url = request.nextUrl.clone();
  const next = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
