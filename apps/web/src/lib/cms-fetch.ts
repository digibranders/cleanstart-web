import { draftMode } from "next/headers";

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

const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL ?? "http://localhost:3000";
const CMS_API_KEY = process.env.CMS_API_KEY;
const CMS_API_KEY_COLLECTION = process.env.CMS_API_KEY_COLLECTION ?? "users";

const DEFAULT_REVALIDATE_SECONDS = 60;

const stripPublishedFilter = (path: string): string => {
  // Path is of the form `/api/<coll>?...querystring...`. Parse the
  // querystring and remove any `where[_status]...` keys so drafts
  // are surfaced.
  const [base, query = ""] = path.split("?", 2);
  if (query.length === 0) return path;
  const params = new URLSearchParams(query);
  const keysToDelete: string[] = [];
  params.forEach((_, key) => {
    if (key.startsWith("where[_status]") || key.startsWith("where[publishedAt][exists]")) {
      keysToDelete.push(key);
    }
  });
  for (const key of keysToDelete) params.delete(key);
  return `${base}?${params.toString()}`;
};

const withDraftFlag = (path: string): string => {
  const [base, query = ""] = path.split("?", 2);
  const params = new URLSearchParams(query);
  params.set("draft", "true");
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

export async function fetchCMS<T>(
  path: string,
  options: CmsFetchOptions = {},
): Promise<T> {
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
    init.cache = "no-store";
  } else {
    init.next = {
      revalidate: options.revalidateSeconds ?? DEFAULT_REVALIDATE_SECONDS,
    };
  }

  const res = await fetch(`${CMS_URL}${effectivePath}`, init);
  if (!res.ok) {
    throw new Error(`CMS fetch failed: ${res.status} ${effectivePath}`);
  }
  return res.json() as Promise<T>;
}

export const cmsBaseUrl = (): string => CMS_URL;
