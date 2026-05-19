import { NextResponse, type NextRequest } from "next/server";

import {
  PERMISSIONS_POLICY,
  REPORTING_ENDPOINTS,
  buildCsp,
  generateNonce,
} from "@/lib/security/csp";
import {
  lookupRedirect,
  shouldSkipRedirectLookup,
} from "@/lib/redirects-cache";

const PRODUCTION_HOST = "www.cleanstart.com";
const APEX_HOST = "cleanstart.com";
const NOINDEX_HOSTS = new Set(["staging.cleanstart.com"]);

function isNoindexHost(host: string | null) {
  if (!host) return false;
  const bare = host.split(":")[0]?.toLowerCase() ?? "";
  return NOINDEX_HOSTS.has(bare);
}

const DRAFT_BYPASS_COOKIE = "__prerender_bypass";

// Flip to "enforce" once the CSP burn-in is complete (see WEB-PRODUCTION.md §4).
const CSP_MODE: "report-only" | "enforce" =
  process.env.CSP_ENFORCE === "1" ? "enforce" : "report-only";

function isLocalhost(host: string | null) {
  if (!host) return false;
  return host.startsWith("localhost") || host.startsWith("127.0.0.1");
}

function shouldRedirectApex(host: string | null) {
  if (!host) return false;
  if (isLocalhost(host)) return false;
  // Strip port for comparison.
  const bare = host.split(":")[0];
  return bare === APEX_HOST;
}

function shouldRedirectTrailingSlash(pathname: string) {
  if (pathname === "/") return false;
  if (!pathname.endsWith("/")) return false;
  // Leave file-style routes alone (e.g. `/sitemap.xml/` is implausible but be safe).
  if (/\.[a-z0-9]+\/$/i.test(pathname)) return false;
  return true;
}

function shouldLowercase(pathname: string) {
  // Only enforce on non-file paths.
  if (/\.[a-z0-9]+$/i.test(pathname)) return false;
  return pathname !== pathname.toLowerCase();
}

export async function proxy(request: NextRequest) {
  const { nextUrl, headers } = request;
  const host = headers.get("host");
  const isProduction = process.env.VERCEL_ENV === "production";
  const isDraftMode = request.cookies.has(DRAFT_BYPASS_COOKIE);
  const isPreviewPath =
    nextUrl.pathname.startsWith("/preview/") ||
    nextUrl.pathname.startsWith("/api/preview/");

  // ---- 308 redirects (run before headers — saves work on the discarded response).

  if (shouldRedirectApex(host)) {
    const url = new URL(nextUrl.toString());
    url.host = PRODUCTION_HOST;
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  if (shouldRedirectTrailingSlash(nextUrl.pathname)) {
    const url = nextUrl.clone();
    url.pathname = nextUrl.pathname.replace(/\/+$/, "");
    return NextResponse.redirect(url, 308);
  }

  if (shouldLowercase(nextUrl.pathname)) {
    const url = nextUrl.clone();
    url.pathname = nextUrl.pathname.toLowerCase();
    return NextResponse.redirect(url, 308);
  }

  // ---- CMS-managed redirects (slug-change, manual, archive, migration seeds).
  // Consulted before the request is forwarded so renamed pages don't 404.
  // Fails open: any lookup error falls through to normal request handling.
  if (!shouldSkipRedirectLookup(nextUrl.pathname)) {
    const row = await lookupRedirect(nextUrl.pathname);
    if (row) {
      if (row.status === "410") {
        return new NextResponse(null, { status: 410 });
      }
      if (row.to) {
        const destination = row.to.startsWith("http")
          ? row.to
          : new URL(row.to, nextUrl.origin).toString();
        return NextResponse.redirect(
          destination,
          Number.parseInt(row.status, 10) as 301 | 302 | 307 | 308,
        );
      }
    }
  }

  // ---- Security headers on the forwarded response.

  const nonce = generateNonce();
  const requestHeaders = new Headers(headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const csp = buildCsp({ nonce, isProduction, isDraftMode, isPreviewPath });
  const cspHeaderName =
    CSP_MODE === "enforce"
      ? "Content-Security-Policy"
      : "Content-Security-Policy-Report-Only";

  response.headers.set(cspHeaderName, csp);
  response.headers.set("Reporting-Endpoints", REPORTING_ENDPOINTS);

  // HSTS only in production. In dev, localhost is served over HTTP and
  // HSTS would pin the browser to upgrade `http://localhost:*` → `https://`
  // for two years, breaking cross-port fetches between the web (3001/3010)
  // and the CMS (3000) — which are http-only locally.
  if (isProduction) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }
  response.headers.set("X-Content-Type-Options", "nosniff");
  // For preview surfaces we rely on CSP `frame-ancestors` (which supports
  // multiple origins including the cross-origin admin host); omit the
  // legacy X-Frame-Options header so it doesn't override CSP with DENY.
  // Modern browsers prefer frame-ancestors when both are present, but
  // older ones (and proxies that strip CSP) may not — explicit omit is
  // safer than "DENY but try to allow via CSP".
  if (!isPreviewPath) {
    response.headers.set(
      "X-Frame-Options",
      isDraftMode ? "SAMEORIGIN" : "DENY",
    );
  }
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  // Preview pages are embedded by the cross-origin admin (different host)
  // — set CORP to cross-origin so the admin iframe can render them.
  response.headers.set(
    "Cross-Origin-Resource-Policy",
    isPreviewPath ? "cross-origin" : "same-site",
  );
  response.headers.set("Permissions-Policy", PERMISSIONS_POLICY);

  if (isDraftMode || !isProduction || isNoindexHost(host)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  } else {
    response.headers.set("X-Robots-Tag", "max-image-preview:large, max-snippet:-1");
  }

  return response;
}

export const config = {
  // Run on every request EXCEPT Next.js internals, static assets, and the CSP
  // report endpoint itself (which would otherwise re-trigger CSP on its own
  // 204 response — wasteful, not harmful).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/csp-report|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|css|js|woff|woff2|ttf|otf|map|txt|xml|json)$).*)",
  ],
};
