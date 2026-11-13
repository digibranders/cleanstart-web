import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import { PATH_HEADER } from "@/lib/next-path";
import { ROUTES } from "@/lib/routes";

/** The password part of an HTTP Basic header, or null when the header is absent or is not valid base64. */
function basicPassword(header: string | null): string | null {
  if (!header?.startsWith("Basic ")) return null;
  try {
    const decoded = atob(header.slice(6));
    return decoded.slice(decoded.indexOf(":") + 1);
  } catch {
    return null;
  }
}

/**
 * Optional shared-password gate for the hosted review copy. Active only when
 * PORTAL_REVIEW_PASSWORD is set, so local development stays open. Removed with the mock in M5.4.
 * shortcut: HTTP Basic with one shared password, enough for a made-up-data mock.
 */
function reviewGate(request: NextRequest): NextResponse | null {
  const password = process.env.PORTAL_REVIEW_PASSWORD;
  if (!password) return null;
  if (basicPassword(request.headers.get("authorization")) === password) return null;
  return new NextResponse("Password required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="CleanStart partner portal review"' },
  });
}

/** The signed in areas. Everything else (sign in, apply, accept invite, reset password, the API) is public. */
export const isProtectedPath = (pathname: string): boolean => /^\/(partner|admin)(\/|$)/.test(pathname);

/**
 * Two jobs. A signed out visit to a signed in area is sent to sign in with the page it asked for. This only looks
 * for the session cookie, it does not read the database: a stale cookie passes here and is caught by the layout
 * guard (requireKind), which is the real check. Then the path is handed to Server Components in a request header,
 * always overwritten so a client cannot choose it.
 */
export function proxy(request: NextRequest): NextResponse {
  // The container health check, the deploy smoke probe and `compose --wait` must not need the review password (plan 06 M0.6).
  if (request.nextUrl.pathname === "/api/health") return NextResponse.next();
  const blocked = reviewGate(request);
  if (blocked) return blocked;

  const { pathname, search } = request.nextUrl;
  if (isProtectedPath(pathname) && !getSessionCookie(request)) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.signIn;
    url.search = `?next=${encodeURIComponent(`${pathname}${search}`)}`;
    return NextResponse.redirect(url);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(PATH_HEADER, `${pathname}${search}`);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|logo-mark.svg).*)"],
};
