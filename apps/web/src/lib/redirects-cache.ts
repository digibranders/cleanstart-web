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

const HIT_TTL_MS = 60_000;
const MISS_TTL_MS = 30_000;
const MAX_ENTRIES = 1000;

export type RedirectStatus = "301" | "302" | "307" | "308" | "410";

export interface RedirectRow {
  from: string;
  to: string | null;
  status: RedirectStatus;
}

interface CacheEntry {
  row: RedirectRow | null;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

const evictIfOversized = (): void => {
  if (cache.size <= MAX_ENTRIES) return;
  // Cheap eviction: drop the oldest 10% by insertion order.
  const dropCount = Math.ceil(MAX_ENTRIES * 0.1);
  let dropped = 0;
  for (const key of cache.keys()) {
    if (dropped >= dropCount) break;
    cache.delete(key);
    dropped += 1;
  }
};

const fetchRedirect = async (pathname: string): Promise<RedirectRow | null> => {
  const params = new URLSearchParams();
  params.set("where[from][equals]", pathname);
  params.set("limit", "1");
  params.set("depth", "0");

  const res = await fetch(`${CMS_URL}/api/redirects?${params.toString()}`, {
    // Edge runtime: no `next: { revalidate }` — we cache in-process.
    headers: { accept: "application/json" },
  });

  if (!res.ok) return null;
  const body = (await res.json()) as { docs?: RedirectRow[] };
  const row = body.docs?.[0];
  if (!row || !row.from) return null;

  return {
    from: row.from,
    to: row.to ?? null,
    status: row.status,
  };
};

export const lookupRedirect = async (
  pathname: string,
): Promise<RedirectRow | null> => {
  const now = Date.now();
  const cached = cache.get(pathname);
  if (cached && cached.expiresAt > now) {
    return cached.row;
  }

  try {
    const row = await fetchRedirect(pathname);
    cache.set(pathname, {
      row,
      expiresAt: now + (row ? HIT_TTL_MS : MISS_TTL_MS),
    });
    evictIfOversized();
    return row;
  } catch {
    // Fail open: cache a brief miss so a CMS hiccup doesn't hammer us.
    cache.set(pathname, { row: null, expiresAt: now + MISS_TTL_MS });
    return null;
  }
};

/**
 * Paths the middleware should NOT even try to resolve as a redirect.
 * Matches the negative space of the existing middleware matcher plus
 * the obvious CMS-irrelevant paths.
 */
export const shouldSkipRedirectLookup = (pathname: string): boolean => {
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/api")) return true;
  if (pathname.startsWith("/images")) return true;
  if (pathname === "/favicon.ico") return true;
  if (/\.[a-z0-9]+$/i.test(pathname)) return true;
  return false;
};
