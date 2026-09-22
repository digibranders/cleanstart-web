/**
 * Cached reader for `siteSettings.baseUrl`.
 *
 * Three separate publish hooks (IndexNow, outbound webhooks, search
 * sync) each need the site's base URL to build a canonical link, and
 * each used to issue its own `findGlobal({ slug: 'siteSettings' })` —
 * three extra round-trips to Postgres on every publish, inside the write
 * transaction, for a value that changes roughly never.
 *
 * `search/sync.ts` already cached it, but cached it forever, so an
 * operator changing the base URL had to restart the process. A short TTL
 * gets the cost down to one read per minute per process while still
 * picking up an edit on its own.
 */

import type { Payload } from 'payload';

import { resolveSiteUrl } from './site-url';

const TTL_MS = 60_000;

/** Narrow contract so tests can pass a stub rather than a full Payload. */
export interface BaseUrlReader {
  findGlobal: (args: { slug: 'siteSettings' }) => Promise<unknown>;
}

let cached: { url: string; at: number } | null = null;

export const readSiteBaseUrl = async (
  payload: BaseUrlReader | Payload,
): Promise<string> => {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.url;
  try {
    const settings = (await (payload as BaseUrlReader).findGlobal({
      slug: 'siteSettings',
    })) as { baseUrl?: string };
    const url = resolveSiteUrl(settings.baseUrl);
    cached = { url, at: Date.now() };
    return url;
  } catch {
    // Never let a settings read failure break a publish — fall back to
    // the env-derived URL and retry on the next call.
    return resolveSiteUrl();
  }
};

/** Test-only — drop the cached value. */
export const __clearSiteBaseUrlCacheForTests = (): void => {
  cached = null;
};
