import { isSafePublicHttpUrl } from './ssrf-guard';

const MAX_REDIRECT_HOPS = 5;

export type FollowFetcher = (
  input: string,
  init: { redirect: 'manual'; signal: AbortSignal; headers?: Record<string, string> },
) => Promise<Response>;

export type FollowRejectKind =
  | 'unsafe-url'
  | 'invalid-url'
  | 'too-many-redirects'
  | 'missing-location';

export type FollowResult =
  | {
      readonly ok: true;
      /** Final non-redirect response — body is unread and available. */
      readonly response: Response;
      /** Final URL after following the redirect chain. */
      readonly finalUrl: string;
      readonly redirected: boolean;
    }
  | { readonly ok: false; readonly kind: FollowRejectKind; readonly url: string };

interface FollowOptions {
  readonly signal: AbortSignal;
  readonly headers?: Record<string, string>;
  /** Override the fetch implementation (tests). Defaults to global `fetch`. */
  readonly fetcher?: FollowFetcher;
}

/**
 * Fetch a URL while re-validating every redirect hop against the shared
 * SSRF guard. A public URL that 3xx-redirects to an internal/metadata
 * address is rejected at the hop where the unsafe `Location` is seen —
 * `redirect: 'manual'` is required so the runtime never auto-follows a
 * hop past the guard. The returned response's body is unread; the caller
 * owns reading/consuming it.
 */
export const followWithSsrfGuard = async (
  url: string,
  options: FollowOptions,
): Promise<FollowResult> => {
  const initialGuard = isSafePublicHttpUrl(url);
  if (!initialGuard.ok) {
    const kind: FollowRejectKind =
      initialGuard.reason === 'invalid-url' || initialGuard.reason === 'non-http-protocol'
        ? 'invalid-url'
        : 'unsafe-url';
    return { ok: false, kind, url };
  }

  const fetcher = options.fetcher ?? (fetch as FollowFetcher);
  let currentUrl = url;
  let redirected = false;

  for (let hop = 0; hop <= MAX_REDIRECT_HOPS; hop += 1) {
    const response = await fetcher(currentUrl, {
      redirect: 'manual',
      signal: options.signal,
      ...(options.headers ? { headers: options.headers } : {}),
    });

    if (response.status < 300 || response.status >= 400) {
      return { ok: true, response, finalUrl: currentUrl, redirected };
    }

    const location = response.headers.get('location');
    if (!location) {
      return { ok: false, kind: 'missing-location', url: currentUrl };
    }

    let next: string;
    try {
      next = new URL(location, currentUrl).toString();
    } catch {
      return { ok: false, kind: 'invalid-url', url: location };
    }

    const nextGuard = isSafePublicHttpUrl(next);
    if (!nextGuard.ok) {
      return { ok: false, kind: 'unsafe-url', url: next };
    }

    currentUrl = next;
    redirected = true;
  }

  return { ok: false, kind: 'too-many-redirects', url: currentUrl };
};
