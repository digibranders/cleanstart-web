import { draftMode } from 'next/headers';

/**
 * Central CMS REST fetcher that is draft-aware.
 *
 * - When Next.js `draftMode()` is OFF (the normal case), behaves
 *   exactly like the prior inline fetcher: 60-second ISR, no auth
 *   header. Public read access to the Payload REST API is enough.
 *
 * - When `draftMode()` is ON (set by `/api/preview/enable` or
 *   `/api/preview/share`), strips any `where[_status]` filter from
 *   the URL (so drafts are returned alongside published), adds the
 *   `draft=true` query param (Payload's documented opt-in for draft
 *   reads), forces `cache: 'no-store'`, and sends the `CMS_API_KEY`
 *   as a bearer credential. The API key user has read-only access
 *   to all draft-enabled collections.
 */

/**
 * Error thrown when the CMS REST API returns a non-2xx response. Carries the
 * HTTP `status` so the app-level error boundary can map it to the right
 * illustrated state (503 → maintenance, 400 → bad-request, else server-error).
 * NOTE: Next.js redacts thrown-error details on the *client* error boundary in
 * production (only `digest` survives), so this mapping is best-effort there;
 * it is reliable in dev and anywhere the error is read server-side.
 */
export class CmsFetchError extends Error {
  readonly status: number;
  constructor(status: number, path: string) {
    super(`CMS fetch failed: ${status} ${path}`);
    this.name = 'CmsFetchError';
    this.status = status;
  }
}

const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL ?? 'http://localhost:3000';
const CMS_API_KEY = process.env.CMS_API_KEY;
const CMS_API_KEY_COLLECTION = process.env.CMS_API_KEY_COLLECTION ?? 'users';

const DEFAULT_REVALIDATE_SECONDS = 60;

const stripPublishedFilter = (path: string): string => {
  // Path is of the form `/api/<coll>?...querystring...`. Parse the
  // querystring and remove any `where[_status]...` keys so drafts
  // are surfaced.
  const [base, query = ''] = path.split('?', 2);
  if (query.length === 0) return path;
  const params = new URLSearchParams(query);
  const keysToDelete: string[] = [];
  params.forEach((_, key) => {
    if (key.startsWith('where[_status]') || key.startsWith('where[publishedAt][exists]')) {
      keysToDelete.push(key);
    }
  });
  for (const key of keysToDelete) params.delete(key);
  return `${base}?${params.toString()}`;
};

const withDraftFlag = (path: string): string => {
  const [base, query = ''] = path.split('?', 2);
  const params = new URLSearchParams(query);
  params.set('draft', 'true');
  return `${base}?${params.toString()}`;
};

export interface CmsFetchOptions {
  /** Override the default ISR window. Ignored in draft mode. */
  revalidateSeconds?: number;
  /** Disable caching entirely for this call (still respected in published mode). */
  noStore?: boolean;
  /**
   * Force draft mode for this call. Used by the `/preview/[collection]/[slug]`
   * route, which validates a JWT in the URL and doesn't rely on the
   * cookie-based `draftMode()`. When undefined, falls back to the cookie.
   */
  draft?: boolean;
}

export async function fetchCMS<T>(path: string, options: CmsFetchOptions = {}): Promise<T> {
  let isDraft = false;
  if (options.draft !== undefined) {
    isDraft = options.draft;
  } else {
    try {
      const dm = await draftMode();
      isDraft = dm.isEnabled;
    } catch {
      // `draftMode()` throws when called outside a request context
      // (e.g. at module import time or in a script). Treat as off.
      isDraft = false;
    }
  }

  let effectivePath = path;
  const headers: Record<string, string> = {};

  if (isDraft) {
    effectivePath = withDraftFlag(stripPublishedFilter(path));
    if (CMS_API_KEY && CMS_API_KEY.length > 0) {
      headers.Authorization = `${CMS_API_KEY_COLLECTION} API-Key ${CMS_API_KEY}`;
    }
  }

  const init: RequestInit & { next?: { revalidate?: number } } = {
    headers,
  };
  if (isDraft || options.noStore) {
    init.cache = 'no-store';
  } else {
    init.next = {
      revalidate: options.revalidateSeconds ?? DEFAULT_REVALIDATE_SECONDS,
    };
  }

  // Retry transient failures — both `fetch()` throwing (connection refused)
  // AND transient gateway statuses (502/503/504). The CMS briefly returns
  // these under load: when hundreds of pages prerender against the single
  // droplet at build time, or during an ISR regeneration while the CMS
  // restarts. Without the 5xx retry, one transient blip fails an entire
  // static build. Non-transient statuses (4xx, 500) surface immediately.
  const RETRYABLE_STATUS = new Set([502, 503, 504]);
  // Retry only outside local dev. In production / build the single CMS droplet
  // briefly refuses connections or 502s under prerender load, so 5 attempts
  // with backoff (~6 s) is the right resilience trade. In `next dev`, a refused
  // connection means "the local CMS isn't running" — not transient — so the
  // same backoff would stall EVERY page ~6 s per failed fetch (the Header alone
  // fans out 5×). Fail fast there; the page renders immediately with empty CMS
  // data, and the dev just starts the CMS when they need it.
  const MAX_ATTEMPTS = process.env.NODE_ENV === 'development' ? 1 : 5;
  // Exponential backoff with jitter: ~0.4s, 0.8s, 1.6s, 3.2s between tries.
  // Long enough to ride out a single CMS droplet briefly saturating under the
  // build's prerender burst, short enough not to stall a healthy request.
  const backoffMs = (attempt: number): number =>
    400 * 2 ** attempt + Math.floor(Math.random() * 200);
  let res: Response | undefined;
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const isLast = attempt === MAX_ATTEMPTS - 1;
    try {
      const candidate = await fetch(`${CMS_URL}${effectivePath}`, init);
      if (RETRYABLE_STATUS.has(candidate.status) && !isLast) {
        lastError = new CmsFetchError(candidate.status, effectivePath);
        await new Promise((resolve) => setTimeout(resolve, backoffMs(attempt)));
        continue;
      }
      res = candidate;
      break;
    } catch (error) {
      lastError = error;
      if (!isLast) await new Promise((resolve) => setTimeout(resolve, backoffMs(attempt)));
    }
  }
  if (!res) throw lastError instanceof Error ? lastError : new CmsFetchError(0, effectivePath);
  if (!res.ok) {
    throw new CmsFetchError(res.status, effectivePath);
  }
  return res.json() as Promise<T>;
}

export const cmsBaseUrl = (): string => CMS_URL;
