/**
 * Run a side effect after the caller's write transaction commits,
 * without making the caller wait for it.
 *
 * Payload runs `afterChange` / `afterDelete` hooks INSIDE the write
 * transaction — `commitTransaction` is the last thing the operation
 * does. Anything a hook awaits is therefore time the editor spends
 * watching a spinner on Save/Publish, and it runs against a database
 * state no other connection can see yet.
 *
 * The publish path had four such hooks per collection (search index,
 * IndexNow, outbound webhooks, ISR purge), each awaiting at least one
 * cross-network call. On a good day that is a few hundred milliseconds
 * stacked onto every publish; when one of those endpoints is merely slow
 * rather than down, it is however long that endpoint takes, because
 * `fetch` has no default timeout.
 *
 * Every one of those effects is already fail-soft and has its own
 * recovery path (webhook dead-letter + retry cron, the nightly
 * Meilisearch drift check, ISR's own TTL), so none of them needs to be
 * inside the save. `runAfterCommit` schedules the work past the commit
 * and returns immediately.
 *
 * Outside a transaction (scripts, endpoints, cron tasks) it awaits the
 * effect inline, so callers that genuinely want to observe the result
 * still get it.
 *
 * CAVEAT for scripts: a Payload local-API write still runs its
 * `afterChange` hooks *inside* the open transaction, so `runAfterCommit`
 * still sees a `transactionID` there and defers — even though, from the
 * script's point of view, `await payload.update(...)` already resolved
 * after the real commit. A script that writes in a loop and then calls
 * `process.exit()` will kill those deferred timers before they fire,
 * silently dropping every afterCommit effect (search index, IndexNow,
 * webhooks). Call `flushPendingAfterCommitEffects()` once after the loop,
 * before exiting — it waits out exactly the grace period every pending
 * effect still needs (bounded, ~COMMIT_GRACE_MS regardless of how many
 * effects are pending, since they run in parallel), so scripts get a
 * correct wait instead of a guessed `setTimeout`.
 */

/**
 * Grace period for the caller's write transaction to commit before the
 * effect runs. Commits here are single-digit milliseconds; the margin is
 * for a loaded database, and overshooting only delays a background
 * effect. Mirrors `COMMIT_GRACE_MS` in `web-revalidate.ts`.
 */
const COMMIT_GRACE_MS = 2_000;

export interface AfterCommitResult {
  /** The effect was scheduled past the commit rather than awaited. */
  readonly deferred: boolean;
}

/**
 * Every effect currently waiting out its grace-period timer. Module-level
 * by design — `runAfterCommit` is called from hooks scattered across many
 * collections with no shared context to thread a registry through, and a
 * script wants to flush all of them (search sync, IndexNow, webhooks)
 * with one call regardless of which collections it touched.
 */
const pending = new Set<Promise<void>>();

export const runAfterCommit = async (
  effect: () => Promise<unknown>,
  // Payload types an open transaction as an id or the promise of one;
  // either way its presence is what matters, never the value.
  transactionID: string | number | Promise<string | number> | undefined,
  onError?: (err: unknown) => void,
): Promise<AfterCommitResult> => {
  const guarded = async (): Promise<void> => {
    try {
      await effect();
    } catch (err) {
      onError?.(err);
    }
  };

  if (transactionID == null) {
    await guarded();
    return { deferred: false };
  }

  let settle: () => void = () => undefined;
  const done = new Promise<void>((resolve) => {
    settle = resolve;
  });
  pending.add(done);

  const timer = setTimeout(() => {
    void guarded().finally(() => {
      pending.delete(done);
      settle();
    });
  }, COMMIT_GRACE_MS);
  // Never hold the process open for a background effect.
  timer.unref?.();

  return { deferred: true };
};

/**
 * Wait for every currently-pending deferred effect to finish running.
 *
 * For a long-running server this is never called — the process stays up
 * long enough for the grace-period timers to fire on their own. It exists
 * for short-lived scripts (seed/backfill jobs): call it once after your
 * write loop and before `process.exit()`, so deferred afterCommit effects
 * (search index, IndexNow, webhooks) actually run instead of being killed
 * mid-timer. Safe to call with nothing pending (resolves immediately) and
 * safe to call more than once.
 */
export const flushPendingAfterCommitEffects = async (): Promise<void> => {
  // A snapshot `Promise.all` would miss an effect scheduled while this is
  // already awaiting (none of today's effects re-enter runAfterCommit, but
  // nothing enforces that) — drain until the set is actually empty.
  while (pending.size > 0) {
    await Promise.all(pending);
  }
};
