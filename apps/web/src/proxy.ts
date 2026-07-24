import {
  NextResponse,
  type NextFetchEvent,
  type NextRequest,
} from "next/server";

import {
  MARKDOWN_INTERNAL_HEADER,
  MARKDOWN_PATH_HEADER,
  acceptsMarkdown,
} from "@/lib/agent-markdown";
import { AGENT_DISCOVERY_LINK_HEADER } from "@/lib/security/agent-discovery";
import {
  PERMISSIONS_POLICY,
  REPORTING_ENDPOINTS,
  buildCsp,
} from "@/lib/security/csp";
import {
  lookupRedirect,
  recordRedirectHit,
  shouldSkipRedirectLookup,
} from "@/lib/redirects-cache";
import { isIndexingAllowed } from "@/lib/seo/indexing";
import { stripLegacyPaginationParams } from "@/lib/seo/legacy-params";

const PRODUCTION_HOST = "www.cleanstart.com";
const APEX_HOST = "cleanstart.com";

const DRAFT_BYPASS_COOKIE = "__prerender_bypass";

// Section landing pages that intentionally have no standalone index — each
// permanently redirects to its canonical first document. The redirect is issued
// here, before any rendering, so crawlers receive a hard 308. A server-component
// `redirect()` can't guarantee that: once the root layout starts streaming (its
// async Header fetches the CMS), Next downgrades the redirect to a 200 + meta
// refresh, which search engines read as a duplicate page (it inherited the
// default/home canonical). Targets are displayOrder-pinned, so they're stable
// across re-seeds; the owning pages keep the same slugs as their fallback.
const SECTION_INDEX_REDIRECTS: Record<string, string> = {
  "/knowledge-hub": "/knowledge-hub/vex-documents",
  "/legal": "/legal/additional-third-party-terms",
};

// Stays report-only until the CSP burn-in is complete; set CSP_ENFORCE=1 to flip.
const CSP_MODE: "report-only" | "enforce" =
  process.env.CSP_ENFORCE === "1" ? "enforce" : "report-only";

function isLocalhost(host: string | null) {
  if (!host) return false;
  return host.startsWith("localhost") || host.startsWith("127.0.0.1");
}

function shouldRedirectApex(host: string | null) {
  if (!host) return false;
  if (isLocalhost(host)) return false;
  const bare = host.split(":")[0];
  return bare === APEX_HOST;
}

function shouldRedirectTrailingSlash(pathname: string) {
  if (pathname === "/") return false;
  if (!pathname.endsWith("/")) return false;
  // Leave file-style routes alone (e.g. a trailing-slashed `/sitemap.xml/`).
  if (/\.[a-z0-9]+\/$/i.test(pathname)) return false;
  return true;
}

function shouldLowercase(pathname: string) {
  // Only enforce on non-file paths.
  if (/\.[a-z0-9]+$/i.test(pathname)) return false;
  // Generated guide covers carry a mixed-case keyword in the path
  // (`/guide-cover/Container%20Networking`); lowercasing it would mangle the
  // rendered text and break next/image optimization of the upstream fetch.
  if (pathname.startsWith("/guide-cover/")) return false;
  return pathname !== pathname.toLowerCase();
}

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const { nextUrl, headers } = request;
  const host = headers.get("host");
  const isProduction = process.env.VERCEL_ENV === "production";
  const isDraftMode = request.cookies.has(DRAFT_BYPASS_COOKIE);
  const isPreviewPath =
    nextUrl.pathname.startsWith("/preview/") ||
    nextUrl.pathname.startsWith("/api/preview/");

  // Redirects run before header work to avoid building headers for a discarded response.

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

  // Legacy Webflow pagination params (`?<hash>_page=N`) survive in Google's
  // index from the pre-migration site — some indexed as their own canonical.
  // The listings ignore them, so 308 to the clean URL to force consolidation.
  const strippedSearch = stripLegacyPaginationParams(nextUrl.search);
  if (strippedSearch !== null) {
    const url = nextUrl.clone();
    url.search = strippedSearch;
    return NextResponse.redirect(url, 308);
  }

  const sectionTarget = SECTION_INDEX_REDIRECTS[nextUrl.pathname];
  if (sectionTarget) {
    const url = nextUrl.clone();
    url.pathname = sectionTarget;
    url.search = "";
    return NextResponse.redirect(url, 308);
  }

  // CMS-managed redirects are consulted before forwarding so renamed pages don't 404.
  // Fails open: any lookup error falls through to normal request handling.
  if (!shouldSkipRedirectLookup(nextUrl.pathname)) {
    const row = await lookupRedirect(nextUrl.pathname);
    if (row) {
      // Record the hit out-of-band so it never delays the redirect.
      // `waitUntil` keeps the request context alive until the POST settles.
      const hit = recordRedirectHit(nextUrl.pathname);
      if (event?.waitUntil) {
        event.waitUntil(hit);
      } else {
        void hit;
      }
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

  const requestHeaders = new Headers(headers);

  // Markdown for agents: an explicit `Accept: text/markdown` on an HTML page
  // is rewritten to the converter route (which self-fetches the page's HTML —
  // its inner request carries the internal marker so it can't loop). Browsers
  // never send text/markdown, so HTML stays the default.
  const wantsMarkdown =
    request.method === "GET" &&
    !isPreviewPath &&
    !nextUrl.pathname.startsWith("/api/") &&
    !headers.has(MARKDOWN_INTERNAL_HEADER) &&
    acceptsMarkdown(headers.get("accept"));

  if (wantsMarkdown) {
    // Query params on the rewrite URL don't reach the handler's nextUrl, but
    // request-header overrides do — carry the original path+search this way.
    requestHeaders.set(MARKDOWN_PATH_HEADER, nextUrl.pathname + nextUrl.search);
  }

  const response = wantsMarkdown
    ? NextResponse.rewrite(new URL("/api/markdown", nextUrl.origin), {
        request: { headers: requestHeaders },
      })
    : NextResponse.next({
        request: { headers: requestHeaders },
      });

  const csp = buildCsp({ isProduction, isDraftMode, isPreviewPath });
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

  if (isDraftMode || isPreviewPath || !isIndexingAllowed(host)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  } else {
    response.headers.set("X-Robots-Tag", "max-image-preview:large, max-snippet:-1");
  }

  // Advertise machine-readable entry points (API catalog, sitemap, search) to
  // agents via RFC 8288 `Link` relations. Append so the framework's preload
  // `Link` headers survive. HTML navigations only — JSON API responses don't
  // need self-referential discovery hints.
  if (!nextUrl.pathname.startsWith("/api/")) {
    response.headers.append("Link", AGENT_DISCOVERY_LINK_HEADER);
    // Page URLs serve HTML or markdown depending on Accept — caches must key
    // on it.
    response.headers.append("Vary", "Accept");
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
