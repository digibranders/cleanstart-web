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
  /**
   * Subtree purge — apps/web calls `revalidatePath(p, 'layout')`. Use `['/']`
   * for a full-site purge (the canonical "revalidate everything" form;
   * `revalidatePath('/')` alone only purges the homepage).
   */
  layoutPaths?: readonly string[];
}

export interface RevalidateResult {
  /** apps/web acknowledged the purge with a 2xx (or there was nothing to send). */
  ok: boolean;
  /** Cross-process invalidation is off (suppressed, or env vars unset). */
  disabled: boolean;
  status?: number;
  error?: string;
}

export const revalidateWeb = async (
  payload: Pick<Payload, 'logger'>,
  request: RevalidateRequest,
): Promise<RevalidateResult> => {
  if (process.env.WEB_REVALIDATE_SUPPRESS === 'true') {
    if (!warnedSuppressed) {
      payload.logger.info(
        '[web-revalidate] WEB_REVALIDATE_SUPPRESS=true; cross-process cache ' +
          'invalidation is suppressed for this run (bulk seed/backfill mode).',
      );
      warnedSuppressed = true;
    }
    return { ok: false, disabled: true };
  }

  const url = process.env.WEB_REVALIDATE_URL;
  const secret = process.env.WEB_REVALIDATE_SECRET;
  if (!url || !secret) {
    if (!warnedDisabled) {
      payload.logger.info(
        '[web-revalidate] WEB_REVALIDATE_URL / WEB_REVALIDATE_SECRET unset; ' +
          'cross-process cache invalidation is disabled (ISR will catch up within the TTL).',
      );
      warnedDisabled = true;
    }
    return { ok: false, disabled: true };
  }

  const tags = Array.from(request.tags ?? []);
  const paths = Array.from(request.paths ?? []);
  const layoutPaths = Array.from(request.layoutPaths ?? []);
  if (tags.length === 0 && paths.length === 0 && layoutPaths.length === 0) {
    return { ok: true, disabled: false };
  }

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), REVALIDATE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ tags, paths, layoutPaths }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      payload.logger.warn(
        `[web-revalidate] non-2xx from apps/web: HTTP ${res.status}`,
      );
      return { ok: false, disabled: false, status: res.status };
    }
    return { ok: true, disabled: false, status: res.status };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    payload.logger.warn(`[web-revalidate] failed: ${error}`);
    return { ok: false, disabled: false, error };
  } finally {
    clearTimeout(timeout);
  }
};
