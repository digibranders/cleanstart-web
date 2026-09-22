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

  const timer = setTimeout(() => {
    void guarded();
  }, COMMIT_GRACE_MS);
  // Never hold the process open for a background effect.
  timer.unref?.();

  return { deferred: true };
};
