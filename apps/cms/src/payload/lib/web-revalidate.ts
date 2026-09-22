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
  /** Scheduled past the caller's transaction rather than sent inline. */
  deferred?: boolean;
  /** Cross-process invalidation is off (suppressed, or env vars unset). */
  disabled: boolean;
  status?: number;
  error?: string;
}

/**
 * Grace period for the caller's write transaction to commit before the purge
 * goes out. Commits here run in single-digit milliseconds; the margin is for a
 * loaded database, and overshooting only delays a cache purge.
 */
const COMMIT_GRACE_MS = 2_000;

/**
 * `revalidateWeb` for callers inside a Payload write.
 *
 * Every afterChange / afterDelete / afterOperation hook runs INSIDE the write
 * transaction: `commitTransaction` is the last thing the operation does. A
 * purge sent from a hook therefore reaches apps/web while the write is still
 * invisible to every other connection, so Next re-renders against the
 * pre-write database and caches that stale result. The Kubernetes whitepaper
 * published on 2026-09-22 stayed a 404 for its whole ISR window this way, and
 * its listing kept the old card until someone purged by hand.
 *
 * With a transaction open the purge is scheduled past the commit and the
 * caller does not wait for it: a hook must not block a save on cache
 * invalidation, and a failure only means the page waits out its TTL. Without
 * one (scripts, endpoints outside a write) it behaves exactly like
 * `revalidateWeb`.
 */
export const revalidateWebAfterCommit = async (
  payload: Pick<Payload, 'logger'>,
  request: RevalidateRequest,
  // Payload types an open transaction as an id or the promise of one; either
  // way its presence is what matters, never the value.
  transactionID: string | number | Promise<string | number> | undefined,
): Promise<RevalidateResult> => {
  if (transactionID == null) return revalidateWeb(payload, request);

  const timer = setTimeout(() => {
    void revalidateWeb(payload, request);
  }, COMMIT_GRACE_MS);
  // Never hold the process open for a cache purge.
  timer.unref?.();

  return { ok: true, disabled: false, deferred: true };
};

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
