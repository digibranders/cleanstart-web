// Maps a CMS collection slug to a public-site URL path, plus helpers
// to convert between display-friendly relative paths and the absolute
// URLs Payload actually stores on link nodes.
//
// Why absolute URLs at the storage layer? Payload's stock LinkNode
// runs `sanitizeUrl(fields.url)` in `createDOM`, which calls
// `new URL(url)` without a base. For a bare path like `/news/foo`
// that throws and falls back to `'https://'`, so the editor renders
// `<a href="https://">` and the link doesn't work. Storing the full
// `https://cleanstart.com/news/foo` parses cleanly and Payload sets
// the right href. On read we strip the origin back off so the popover
// surfaces the path under the Internal radio.
//
// Patterns mirror typical Next.js / public-site routing. When
// `apps/web` ships and finalizes routes, update this map and add a
// migration if any path shape changes.

const ROUTES: Record<string, string> = {
  authors: '/author',
  blogs: '/blog',
  events: '/events',
  guides: '/guides',
  jobs: '/careers',
  knowledgeBase: '/knowledge-hub',
  news: '/news',
  pages: '',
  resources: '/resources',
  webinars: '/webinars',
};

const SITE_ORIGIN_FALLBACK = 'https://www.cleanstart.com';

export const SITE_ORIGIN: string = (() => {
  const raw = process.env.NEXT_PUBLIC_SITE_ORIGIN;
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    return SITE_ORIGIN_FALLBACK;
  }
  // Drop trailing slash so concatenation with leading-slash paths
  // doesn't double up.
  return raw.trim().replace(/\/$/, '');
})();

export const resolveInternalPath = (
  collection: string,
  slug: string | null,
): string | null => {
  if (!slug) return null;
  const base = ROUTES[collection];
  if (base === undefined) return null;
  return `${base}/${slug.replace(/^\/+/, '')}`;
};

// Convert a path / anchor / query into an absolute URL Payload's
// sanitizer will accept. Already-absolute URLs pass through.
export const toStoredUrl = (input: string): string => {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) {
    return `${SITE_ORIGIN}${trimmed}`;
  }
  // Hash and query fragments are relative to the site root without a path
  // separator — `#anchor` → `https://origin#anchor` round-trips back to
  // `#anchor`, while inserting a `/` would yield `/#anchor` on decode.
  if (trimmed.startsWith('#') || trimmed.startsWith('?')) {
    return `${SITE_ORIGIN}${trimmed}`;
  }
  return trimmed;
};

// Compare hosts as the same site regardless of a leading `www.` or the
// http/https scheme. Migrated content stores links on `www.cleanstart.com`
// while `SITE_ORIGIN` may be the apex `cleanstart.com`; without this they read
// as External in the popover (the radio defaults wrong and rel flips to
// nofollow). Sibling subdomains (`images.`, `cms.`) still differ and stay
// external.
const normaliseHost = (host: string): string =>
  host.toLowerCase().replace(/^www\./, '');

// Inverse of `toStoredUrl` for display. If `stored` lives on the
// configured site origin, strip it to a relative path so the popover
// shows `/news/foo` under Internal. Foreign URLs come back unchanged.
export const fromStoredUrl = (stored: string): string => {
  if (!stored) return stored;
  try {
    const parsed = new URL(stored);
    const origin = new URL(SITE_ORIGIN);
    if (normaliseHost(parsed.host) === normaliseHost(origin.host)) {
      const tail = `${parsed.pathname}${parsed.search}${parsed.hash}`;
      return tail || '/';
    }
  } catch {
    // Not a parseable URL — return as-is.
  }
  return stored;
};
