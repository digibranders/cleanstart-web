/**
 * Agent-discovery `Link` response headers (RFC 8288) + API catalog (RFC 9727).
 *
 * Automated agents inspect the homepage's `Link` headers to find an origin's
 * machine-readable entry points. Next.js already emits `Link` headers for
 * resource preloading, but those carry no *registered* relation types, so a
 * scanner reports "no agent-useful relation types found". We append a second
 * `Link` value advertising three registered relations that resolve to real,
 * public resources:
 *
 *   - `api-catalog`  → `/.well-known/api-catalog` (RFC 9727 §3 / RFC 9264 linkset)
 *   - `sitemap`      → `/sitemap.xml`
 *   - `service-desc` → `/api/search` (public JSON content-search endpoint)
 *
 * This module is the single source of truth for both the header string and the
 * catalog body; the static `public/.well-known/api-catalog` file is asserted to
 * match `API_CATALOG` in `agent-discovery.test.ts` so the two never drift.
 */

/** Well-known URI for the API catalog (RFC 9727 §3). */
export const API_CATALOG_PATH = "/.well-known/api-catalog";

/** RFC 9264 link-set media type — the catalog is served with this Content-Type. */
export const API_CATALOG_CONTENT_TYPE = "application/linkset+json";

/**
 * Public, agent-usable resources advertised to crawlers. Targets are
 * root-relative so the catalog resolves against whatever host serves it
 * (production, staging, or a preview deployment) without hard-coding a domain.
 */
const SITEMAP_PATH = "/sitemap.xml";
const SEARCH_API_PATH = "/api/search";
const HEALTH_API_PATH = "/api/health";

/**
 * The `Link` header value (RFC 8288). Comma-separated relations on a single
 * header line; appended (never replacing) so the framework's preload `Link`
 * values are preserved.
 */
export const AGENT_DISCOVERY_LINK_HEADER = [
  `<${API_CATALOG_PATH}>; rel="api-catalog"; type="${API_CATALOG_CONTENT_TYPE}"`,
  `<${SITEMAP_PATH}>; rel="sitemap"; type="application/xml"`,
  `<${SEARCH_API_PATH}>; rel="service-desc"; type="application/json"`,
].join(", ");

/** RFC 9264 link-set context object: one anchor with its typed link targets. */
interface LinkTarget {
  href: string;
  type: string;
  title?: string;
}
interface LinkSetContext {
  anchor: string;
  [relationType: string]: string | LinkTarget[];
}

/**
 * The API catalog body (RFC 9264 `application/linkset+json`). Anchored at the
 * site root and listing the machine-readable resources an agent can use.
 */
export const API_CATALOG: { linkset: LinkSetContext[] } = {
  linkset: [
    {
      anchor: "/",
      "service-desc": [
        {
          href: SEARCH_API_PATH,
          type: "application/json",
          title:
            "CleanStart content search — GET ?q=<query>&type=<collection>&limit=<n> returns JSON hits",
        },
      ],
      status: [
        {
          href: HEALTH_API_PATH,
          type: "application/json",
          title: "Service health probe",
        },
      ],
      sitemap: [
        {
          href: SITEMAP_PATH,
          type: "application/xml",
        },
      ],
    },
  ],
};
