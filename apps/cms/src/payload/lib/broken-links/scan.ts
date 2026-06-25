import { isSafePublicHttpUrl } from '../url-safety/ssrf-guard';
import { type ExtractedLink, extractAllLinks } from './extract';

/**
 * Pure scanner. Walks each emittable collection's published docs,
 * extracts URLs (with anchor text + location) via `extractAllLinks`,
 * runs HEAD-checks following redirects to the final landing page, and
 * produces a per-doc / per-URL plan the caller persists into the
 * `brokenLinks` collection.
 *
 * The scanner is rate-limited at the URL level so a single broken
 * external host doesn't tank the whole run with retry waterfalls —
 * one chain per URL per cycle, 5s timeout per hop, no retry.
 */

const SCAN_COLLECTIONS = [
  'blogs',
  'news',
  'guides',
  'knowledgeBase',
  'resources',
  'events',
  'webinars',
  'jobs',
  'pages',
] as const;

const HEAD_TIMEOUT_MS = 5000;
const MAX_REDIRECT_HOPS = 5;

export type LinkStatus = 'ok' | 'broken' | 'network';

export interface BrokenLinkRecord {
  readonly url: string;
  readonly status: LinkStatus;
  readonly httpStatus: number;
  readonly finalUrl: string | null;
  readonly sourceCollection: string;
  readonly sourceDocId: string;
  readonly sourceDocSlug: string | null;
  readonly sourceDocTitle: string | null;
  readonly anchorText: string | null;
  readonly location: string | null;
}

interface DocLite {
  id: string | number;
  slug?: string | null;
  title?: string | null;
  body?: unknown;
  seo?: { canonicalOverride?: string | null } | null;
  applyUrl?: string | null;
  atsUrl?: string | null;
  registrationUrl?: string | null;
  recordingUrl?: string | null;
  slidesUrl?: string | null;
  newsLink?: string | null;
}

export interface ScannerPayload {
  find: (args: {
    collection: string;
    where?: unknown;
    limit?: number;
    page?: number;
    sort?: string;
    depth?: number;
    overrideAccess?: boolean;
    draft?: boolean;
  }) => Promise<{ docs: DocLite[]; hasNextPage?: boolean }>;
}

interface SeedRecord {
  url: string;
  sourceCollection: string;
  sourceDocId: string;
  sourceDocSlug: string | null;
  sourceDocTitle?: string | null;
  anchorText?: string | null;
  location?: string | null;
}

export interface ScanArgs {
  readonly payload: ScannerPayload;
  /** Override fetch — used by tests. */
  readonly fetcher?: typeof fetch;
  /** Override URL list (skip the find() walk) — used by tests. */
  readonly seedRecords?: readonly SeedRecord[];
}

interface CheckResult {
  status: LinkStatus;
  httpStatus: number;
  finalUrl: string;
}

/**
 * HEAD-check a URL, following redirects manually so we classify by the
 * FINAL landing page, not the hop. A redirect to a healthy page is `ok`
 * (it never persists); a redirect that lands on a 4xx/5xx is `broken`
 * with the final status. Every hop is re-validated through the SSRF
 * guard — blind redirect-following would let an editor-planted link 302
 * to an internal address.
 */
const checkUrl = async (url: string, fetcher: typeof fetch): Promise<CheckResult> => {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECT_HOPS; hop += 1) {
    if (!isSafePublicHttpUrl(current).ok) {
      return { status: 'network', httpStatus: 0, finalUrl: current };
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HEAD_TIMEOUT_MS);
    const tryFetch = async (method: 'HEAD' | 'GET') =>
      fetcher(current, { method, redirect: 'manual', signal: controller.signal });
    try {
      let res = await tryFetch('HEAD');
      if (res.status === 405 || res.status === 501) {
        res = await tryFetch('GET');
      }
      clearTimeout(timer);
      if (res.status >= 200 && res.status < 300) {
        return { status: 'ok', httpStatus: res.status, finalUrl: current };
      }
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location');
        if (!location || hop === MAX_REDIRECT_HOPS) {
          return { status: 'broken', httpStatus: res.status, finalUrl: current };
        }
        try {
          current = new URL(location, current).toString();
        } catch {
          return { status: 'broken', httpStatus: res.status, finalUrl: current };
        }
        continue;
      }
      return { status: 'broken', httpStatus: res.status, finalUrl: current };
    } catch {
      clearTimeout(timer);
      return { status: 'network', httpStatus: 0, finalUrl: current };
    }
  }
  return { status: 'broken', httpStatus: 0, finalUrl: current };
};

/**
 * Walk every routable collection, collect (doc, url) pairs with anchor
 * text + location, run checks, and return one record per pair. Caller
 * persists to `brokenLinks` (idempotent upsert by `url + sourceDocId`).
 */
export const scanForBrokenLinks = async (args: ScanArgs): Promise<BrokenLinkRecord[]> => {
  const fetcher = args.fetcher ?? fetch;
  const records: BrokenLinkRecord[] = [];

  type Pair = {
    url: string;
    sourceCollection: string;
    sourceDocId: string;
    sourceDocSlug: string | null;
    sourceDocTitle: string | null;
    anchorText: string | null;
    location: string | null;
  };
  const pairs: Pair[] = [];

  if (args.seedRecords) {
    for (const r of args.seedRecords) {
      pairs.push({
        url: r.url,
        sourceCollection: r.sourceCollection,
        sourceDocId: r.sourceDocId,
        sourceDocSlug: r.sourceDocSlug,
        sourceDocTitle: r.sourceDocTitle ?? null,
        anchorText: r.anchorText ?? null,
        location: r.location ?? null,
      });
    }
  } else {
    for (const collection of SCAN_COLLECTIONS) {
      let page = 1;
      while (page <= 50) {
        const result = await args.payload.find({
          collection,
          limit: 100,
          page,
          depth: 0,
          overrideAccess: true,
          draft: false,
          where: { _status: { equals: 'published' } },
        });
        for (const doc of result.docs) {
          const links: ExtractedLink[] = extractAllLinks(doc as unknown as Record<string, unknown>);
          for (const link of links) {
            pairs.push({
              url: link.url,
              sourceCollection: collection,
              sourceDocId: String(doc.id),
              sourceDocSlug: typeof doc.slug === 'string' ? doc.slug : null,
              sourceDocTitle: typeof doc.title === 'string' ? doc.title : null,
              anchorText: link.anchorText,
              location: link.location,
            });
          }
        }
        if (!result.hasNextPage) break;
        page += 1;
      }
    }
  }

  // De-dupe by URL: one HEAD-chain per unique URL, fan back out to all
  // pairs that referenced it. Run with a small concurrency cap so a doc
  // with hundreds of outbound links doesn't serialise into hours of work.
  const CHECK_CONCURRENCY = 8;
  const uniqueUrls = [...new Set(pairs.map((p) => p.url))];
  const checks = new Map<string, CheckResult>();
  let cursor = 0;
  const worker = async (): Promise<void> => {
    while (true) {
      const i = cursor;
      cursor += 1;
      if (i >= uniqueUrls.length) return;
      const url = uniqueUrls[i];
      if (typeof url !== 'string') continue;
      checks.set(url, await checkUrl(url, fetcher));
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(CHECK_CONCURRENCY, uniqueUrls.length) }, () => worker()),
  );

  for (const pair of pairs) {
    const result = checks.get(pair.url);
    if (!result) continue;
    records.push({
      url: pair.url,
      status: result.status,
      httpStatus: result.httpStatus,
      finalUrl: result.finalUrl !== pair.url ? result.finalUrl : null,
      sourceCollection: pair.sourceCollection,
      sourceDocId: pair.sourceDocId,
      sourceDocSlug: pair.sourceDocSlug,
      sourceDocTitle: pair.sourceDocTitle,
      anchorText: pair.anchorText,
      location: pair.location,
    });
  }

  return records;
};
