/**
 * Cross-process cache invalidation. The CMS calls into the apps/web
 * Next.js process when content changes in a way that needs ISR pages
 * to refresh sooner than their default 60s revalidate window — for
 * example after a Media filename rename moves R2 objects.
 *
 * Configured by env vars on the CMS side:
 *   - WEB_REVALIDATE_URL      — fully-qualified URL to the apps/web
 *                                `/api/revalidate` endpoint.
 *   - WEB_REVALIDATE_SECRET   — bearer token shared with apps/web.
 *   - WEB_REVALIDATE_SUPPRESS — when 'true', the helper no-ops regardless of
 *                                the URL/secret. Set this for bulk seed /
 *                                backfill scripts that re-save hundreds of
 *                                already-published docs: each `payload.update`
 *                                otherwise fires one revalidation per doc,
 *                                which fans out into a billed ISR write per
 *                                affected page on Vercel. Time-based ISR (1h
 *                                fallback) catches the changes up on its own;
 *                                trigger one broad revalidation after the run
 *                                if the content needs to go live sooner.
 *
 * When the URL/secret are unset, the helper logs once and no-ops. We never
 * block a write operation on a revalidation failure — the worst case
 * without revalidation is "URLs may be stale for up to the ISR TTL".
 */

import type { Payload } from 'payload';

const REVALIDATE_TIMEOUT_MS = 5_000;

let warnedDisabled = false;
let warnedSuppressed = false;

export interface RevalidateRequest {
  tags?: readonly string[];
  paths?: readonly string[];
}

export const revalidateWeb = async (
  payload: Pick<Payload, 'logger'>,
  request: RevalidateRequest,
): Promise<void> => {
  if (process.env.WEB_REVALIDATE_SUPPRESS === 'true') {
    if (!warnedSuppressed) {
      payload.logger.info(
        '[web-revalidate] WEB_REVALIDATE_SUPPRESS=true; cross-process cache ' +
          'invalidation is suppressed for this run (bulk seed/backfill mode).',
      );
      warnedSuppressed = true;
    }
    return;
  }

  const url = process.env.WEB_REVALIDATE_URL;
  const secret = process.env.WEB_REVALIDATE_SECRET;
  if (!url || !secret) {
    if (!warnedDisabled) {
      payload.logger.info(
        '[web-revalidate] WEB_REVALIDATE_URL / WEB_REVALIDATE_SECRET unset; ' +
          'cross-process cache invalidation is disabled (ISR will catch up within ~60s).',
      );
      warnedDisabled = true;
    }
    return;
  }

  const tags = Array.from(request.tags ?? []);
  const paths = Array.from(request.paths ?? []);
  if (tags.length === 0 && paths.length === 0) return;

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), REVALIDATE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ tags, paths }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      payload.logger.warn(
        `[web-revalidate] non-2xx from apps/web: HTTP ${res.status}`,
      );
    }
  } catch (err) {
    payload.logger.warn(
      `[web-revalidate] failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  } finally {
    clearTimeout(timeout);
  }
};
