/**
 * Edge-runtime lookup against the CMS `redirects` collection.
 *
 * Read access is public (see apps/cms/src/payload/collections/Redirects.ts),
 * so no auth is required. Result is cached in-process to avoid hitting CMS
 * on every request — TTLs are short enough that an editor adding a row
 * in the admin propagates within ~minute without restarting.
 *
 * The module deliberately does NOT throw on transport errors: middleware
 * must fail open. A redirect lookup outage is preferable to a site outage.
 */

const CMS_URL =
  process.env.NEXT_PUBLIC_CMS_URL ?? "http://localhost:3000";

// The redirect table is a small, editor-curated set (tens of rows), so the
// whole thing is loaded once per isolate and every lookup is answered from
// memory. This replaces the old per-path fetch, which cost one CMS round-trip
// per distinct URL on every cold edge isolate — a per-request TTFB tax on a
// serverless platform that cold-starts middleware constantly.
const FULL_TTL_MS = 60_000; // refresh window; an editor's new row lands within a minute
const ERROR_BACKOFF_MS = 10_000; // after a failed refresh, wait before retrying

export type RedirectStatus = "301" | "302" | "307" | "308" | "410";

export interface RedirectRow {
  from: string;
  to: string | null;
  status: RedirectStatus;
}

interface RedirectIndex {
  map: Map<string, RedirectRow>;
  expiresAt: number;
}

let index: RedirectIndex | null = null;
// Dedupe concurrent refreshes so a burst of requests on a cold isolate triggers
// a single CMS fetch, not one per in-flight request.
let inflight: Promise<Map<string, RedirectRow>> | null = null;

const fetchAllRedirects = async (): Promise<Map<string, RedirectRow>> => {
  const map = new Map<string, RedirectRow>();
  // Page through defensively with a hard cap so a runaway paginator can't spin.
  for (let page = 1; page <= 20; page += 1) {
    const params = new URLSearchParams();
    params.set("limit", "100");
    params.set("page", String(page));
    params.set("depth", "0");

    const res = await fetch(`${CMS_URL}/api/redirects?${params.toString()}`, {
      // Edge runtime: no `next: { revalidate }` — we cache the map in-process.
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`redirects fetch failed: ${res.status}`);

    const body = (await res.json()) as {
      docs?: RedirectRow[];
      hasNextPage?: boolean;
    };
    for (const row of body.docs ?? []) {
      if (row?.from) {
        map.set(row.from, {
          from: row.from,
          to: row.to ?? null,
          status: row.status,
        });
      }
    }
    if (!body.hasNextPage) break;
  }
  return map;
};

const ensureIndex = async (): Promise<Map<string, RedirectRow>> => {
  if (index && index.expiresAt > Date.now()) return index.map;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const map = await fetchAllRedirects();
      index = { map, expiresAt: Date.now() + FULL_TTL_MS };
      return map;
    } catch {
      // Fail open: keep serving the last-known table if we have one, else treat
      // everything as "no redirect". Back off before retrying so a CMS hiccup
      // can't turn into a fetch storm.
      const fallback = index?.map ?? new Map<string, RedirectRow>();
      index = { map: fallback, expiresAt: Date.now() + ERROR_BACKOFF_MS };
      return fallback;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
};

export const lookupRedirect = async (
  pathname: string,
): Promise<RedirectRow | null> => {
  const map = await ensureIndex();
  return map.get(pathname) ?? null;
};

/**
 * Fire-and-forget hit recorder. Posts the matched path to the CMS so it can
 * bump `hitCount` / `lastHitAt` on the redirect row. Called on every matched
 * request (cache hit or miss), so counts reflect traffic rather than the
 * in-process cache's refresh rate.
 *
 * Resolves/rejects are swallowed by the caller via `event.waitUntil`; this
 * never throws so a counting outage can't affect the redirect itself.
 */
export const recordRedirectHit = async (pathname: string): Promise<void> => {
  const secret = process.env.REDIRECT_HIT_SECRET;
  try {
    await fetch(`${CMS_URL}/api/redirects/record-hit`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(secret ? { "x-redirect-hit-secret": secret } : {}),
      },
      body: JSON.stringify({ from: pathname }),
    });
  } catch {
    // Best-effort analytics: a counting failure must never affect the redirect.
  }
};

/**
 * Paths the middleware should NOT even try to resolve as a redirect.
 * Matches the negative space of the existing middleware matcher plus
 * the obvious CMS-irrelevant paths.
 */
export const shouldSkipRedirectLookup = (pathname: string): boolean => {
  // The site root is the home page, never a CMS-managed legacy redirect (those
  // are all sub-paths like `/jobs` → `/careers`). Skipping it means the most-
  // trafficked URL never waits on the redirect index — directly trimming home TTFB.
  if (pathname === "/") return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/api")) return true;
  if (pathname.startsWith("/images")) return true;
  if (pathname === "/favicon.ico") return true;
  if (/\.[a-z0-9]+$/i.test(pathname)) return true;
  return false;
};
