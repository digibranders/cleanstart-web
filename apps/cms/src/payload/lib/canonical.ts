export type CanonicalIssue =
  | 'invalid-url'
  | 'not-https'
  | 'has-query-or-fragment';

export type CanonicalCheck =
  | { ok: true }
  | { ok: false; severity: 'error'; issue: CanonicalIssue; message: string }
  | { ok: false; severity: 'warn'; issue: CanonicalIssue; message: string };

/**
 * Validates a custom canonical override URL.
 *
 * Both same-domain and cross-domain canonicals are legitimate and
 * common. The validator only blocks structural problems with the URL
 * itself; it does NOT push editors toward redirects, because canonical
 * and redirect serve different purposes:
 *
 *   - REDIRECT — server tells the browser "go to this other URL".
 *     Used when the variant URL should physically navigate away.
 *
 *   - CANONICAL — search engine signal saying "this URL is the
 *     source-of-truth for this content; index the canonical, dedupe
 *     variants against it." The variant URL keeps serving content;
 *     only the indexing signal changes.
 *
 * Same-domain canonical is the right tool when:
 *   - faceted/filtered listing URLs must keep serving (e.g.
 *     `/products?color=blue`) but should not be indexed independently
 *   - tracking-parameter URLs (e.g. `?utm=...`) preserve attribution
 *     while pointing the index at the clean URL
 *   - paginated slices (`?page=2`) keep serving but the canonical
 *     points editors at the first page or a hub
 *   - A/B test variants both serve real traffic but only one should
 *     be indexed
 *   - legacy URL patterns are preserved alongside a new structure
 *     for bookmark / inbound-link compatibility
 *
 * Cross-domain canonical is the right tool when content is
 * republished elsewhere (Medium, partner sites, syndication).
 */
export const validateCanonicalOverride = (raw: string | null | undefined): CanonicalCheck => {
  if (raw == null || raw.trim().length === 0) {
    return {
      ok: false,
      severity: 'error',
      issue: 'invalid-url',
      message: 'Custom canonical URL is required when the toggle is on. Toggle off to use the default.',
    };
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return {
      ok: false,
      severity: 'error',
      issue: 'invalid-url',
      message: 'Canonical must be a complete URL starting with https://.',
    };
  }

  if (url.protocol !== 'https:') {
    return {
      ok: false,
      severity: 'error',
      issue: 'not-https',
      message: 'Canonical must use HTTPS.',
    };
  }

  if (url.search.length > 0 || url.hash.length > 0) {
    return {
      ok: false,
      severity: 'warn',
      issue: 'has-query-or-fragment',
      message:
        "Canonicals usually don't include query strings or anchors. Remove them unless you specifically need them.",
    };
  }

  return { ok: true };
};
