/**
 * Webflow's `News Link` field on the News collection held a URL
 * pointing at the original outlet for syndicated coverage (TechCrunch,
 * The Hindu, etc). Payload doesn't have a dedicated field — the
 * correct mapping is `seo.useCustomCanonical=true` +
 * `seo.canonicalOverride=<News Link>` so search engines credit the
 * original publisher (per Google's syndicated-content guidance).
 *
 * Pure resolver: returns the canonical-override patch when the link
 * is set AND points off-domain; returns null when the news is
 * original reporting (no News Link) or the link points back at
 * cleanstart.com itself.
 */

const SITE_HOSTS = ['cleanstart.com', 'www.cleanstart.com'];

const isExternal = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return !SITE_HOSTS.includes(parsed.host.toLowerCase());
  } catch {
    return false;
  }
};

export interface CanonicalPatch {
  readonly useCustomCanonical: true;
  readonly canonicalOverride: string;
}

/**
 * Map a Webflow `News Link` value to a canonical-override patch
 * suitable for spreading into `seo.*` at ETL time. Returns null when
 * no override is needed.
 */
export const newsLinkToCanonicalPatch = (
  newsLink: unknown,
): CanonicalPatch | null => {
  if (typeof newsLink !== 'string') return null;
  const trimmed = newsLink.trim();
  if (trimmed.length === 0) return null;
  if (!/^https?:\/\//i.test(trimmed)) return null;
  if (!isExternal(trimmed)) return null;
  return {
    useCustomCanonical: true,
    canonicalOverride: trimmed,
  };
};
