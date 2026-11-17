import { createHash, timingSafeEqual } from "node:crypto";
import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import { PATH_HEADER } from "@/lib/next-path";
import { isDemoMode } from "@/server/demo";
import { ROUTES } from "@/lib/routes";
import { buildCsp, createNonce, originsFromEnv } from "@/server/security/csp";
import { CLIENT_IP_HEADER, clientIpFromForwardedFor, parseTrustedProxyHops } from "@/server/security/client-ip";

/** Paths that answer without the review password: the container health check and the signed HubSpot webhook. */
const OPEN_PATHS: readonly string[] = ["/api/health", "/api/hubspot/webhook"];

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

/** Constant time compare: equal length SHA-256 digests, so neither the content nor the length of the password leaks. */
function sameSecret(a: string, b: string): boolean {
  return timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());
}

/**
 * Optional shared-password gate in front of the hosted portal. Active only when
 * PORTAL_REVIEW_PASSWORD is set, so local development stays open. It stays until launch; removing it is a launch step.
 * shortcut: HTTP Basic with one shared password, enough for an invite-only pilot.
 */
function reviewGate(request: NextRequest): NextResponse | null {
  const password = process.env.PORTAL_REVIEW_PASSWORD;
  if (!password) return null;
  const supplied = basicPassword(request.headers.get("authorization"));
  if (supplied !== null && sameSecret(supplied, password)) return null;
  return new NextResponse("Password required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="CleanStart partner portal review"' },
  });
}

const PROTECTED_AREA = /^\/(partner|admin)(\/|$)/;

/** One round of percent decoding, the way Next.js matches routes. Per segment, so one malformed escape leaves only its own segment as it is. */
function decodePath(pathname: string): string {
  return pathname
    .split("/")
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    })
    .join("/");
}

/**
 * The signed in areas. Everything else (sign in, apply, accept invite, reset password, the API) is public. The raw and
 * the decoded path are both checked, so `/%61dmin/approvals` cannot skip the session redirect that `/admin/approvals` gets.
 */
export const isProtectedPath = (pathname: string): boolean => PROTECTED_AREA.test(pathname) || PROTECTED_AREA.test(decodePath(pathname));

/**
 * What every request does first: the request headers Server Components and route handlers will see. The client
 * address header is always deleted and then written from the trusted x-forwarded-for entry (or left out), so a client
 * can neither choose its own address nor pick a fresh rate limit bucket by rotating x-forwarded-for (see client-ip.ts).
 */
function requestHeadersFor(request: NextRequest): Headers {
  const headers = new Headers(request.headers);
  headers.delete(CLIENT_IP_HEADER);
  const ip = clientIpFromForwardedFor(request.headers.get("x-forwarded-for"), parseTrustedProxyHops(process.env.PORTAL_TRUSTED_PROXY_HOPS));
  if (ip) headers.set(CLIENT_IP_HEADER, ip);
  return headers;
}

/**
 * Four jobs. The open paths pass straight through. A signed out visit to a signed in area is sent to sign in with the
 * page it asked for; this only looks for the session cookie, it does not read the database: a stale cookie passes
 * here and is caught by the layout guard (requireKind), which is the real check. The path is handed to Server
 * Components in a request header, always overwritten so a client cannot choose it. Pages get a
 * Content-Security-Policy with a fresh nonce: Next reads the nonce from the request's CSP header while it renders,
 * so the header goes on the request as well as the response (Next docs, "Content Security Policy"). API routes
 * return JSON, so next.config.ts gives them a closed policy instead.
 */
function handle(request: NextRequest): NextResponse {
  const requestHeaders = requestHeadersFor(request);
  const { pathname, search } = request.nextUrl;
  // The container health check, the deploy smoke probe and `compose --wait` must not need the review password (plan 06 M0.6).
  // The HubSpot webhook cannot send Basic auth; the route verifies the HubSpot v3 signature itself (and answers 503 when its secret is unset).
  if (OPEN_PATHS.includes(pathname)) return NextResponse.next({ request: { headers: requestHeaders } });
  const blocked = reviewGate(request);
  if (blocked) return blocked;

  if (isProtectedPath(pathname) && !getSessionCookie(request)) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.signIn;
    url.search = `?next=${encodeURIComponent(`${pathname}${search}`)}`;
    return NextResponse.redirect(url);
  }

  requestHeaders.set(PATH_HEADER, `${pathname}${search}`);
  if (pathname.startsWith("/api/")) return NextResponse.next({ request: { headers: requestHeaders } });

  const nonce = createNonce();
  const csp = buildCsp({ nonce, isDev: process.env.NODE_ENV === "development", connectOrigins: originsFromEnv(process.env) });
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

/** The proxy. In demo mode every answer, the 401 and the redirects included, also says noindex: the demo must never be indexed (next.config.ts sets the same header on pages). */
export function proxy(request: NextRequest): NextResponse {
  const response = handle(request);
  if (isDemoMode()) response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|logo-mark.svg).*)"],
};
