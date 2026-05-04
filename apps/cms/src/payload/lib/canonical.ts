const SAME_DOMAIN_HOSTS = new Set(['cleanstart.com', 'www.cleanstart.com']);

export type CanonicalIssue =
  | 'invalid-url'
  | 'not-https'
  | 'same-domain'
  | 'has-query-or-fragment';

export type CanonicalCheck =
  | { ok: true }
  | { ok: false; severity: 'error'; issue: CanonicalIssue; message: string }
  | { ok: false; severity: 'warn'; issue: CanonicalIssue; message: string };

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

  if (SAME_DOMAIN_HOSTS.has(url.hostname)) {
    return {
      ok: false,
      severity: 'warn',
      issue: 'same-domain',
      message:
        "You're canonicalising to your own site. That's almost always a redirect, not a canonical. Use the Redirects collection instead.",
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
