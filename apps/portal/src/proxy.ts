import { type NextRequest, NextResponse } from "next/server";

/**
 * Optional shared-password gate for the hosted review copy. Active only when
 * PORTAL_REVIEW_PASSWORD is set, so local development stays open.
 * shortcut: HTTP Basic with one shared password, enough for a made-up-data mock. Replace with real auth before any real data.
 */
export function proxy(request: NextRequest): NextResponse {
  const password = process.env.PORTAL_REVIEW_PASSWORD;
  if (!password) return NextResponse.next();

  const header = request.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    const decoded = atob(header.slice(6));
    if (decoded.slice(decoded.indexOf(":") + 1) === password) return NextResponse.next();
  }
  return new NextResponse("Password required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="CleanStart partner portal review"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|logo-mark.svg).*)"],
};
