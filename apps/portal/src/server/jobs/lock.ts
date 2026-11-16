import type { Pool } from 'pg';
import { log } from '@/server/log';

/** Returns false without running `fn` when another connection already holds the lock for `name`. */
export const runLocked = async (pool: Pool, name: string, fn: () => Promise<void>): Promise<boolean> => {
  const key = `portal:${name}`;
  const client = await pool.connect();
  let discard: Error | undefined;
  try {
    const { rows } = await client.query<{ ok: boolean }>('select pg_try_advisory_lock(hashtext($1)) as ok', [key]);
    if (!rows[0]?.ok) return false;
    let jobError: unknown;
    let failed = false;
    try {
      await fn();
    } catch (error) {
      failed = true;
      jobError = error;
    }
    try {
      await client.query('select pg_advisory_unlock(hashtext($1))', [key]);
    } catch (error) {
      // An unreleased session lock must not return to the pool: destroying the connection frees it.
      discard = error instanceof Error ? error : new Error(String(error));
      // When the job failed too, its error is the one the caller needs; the unlock failure is logged instead of masking it.
      if (!failed) throw error;
      log.error({ job: name, err: error }, 'advisory unlock failed after the job failed');
    }
    if (failed) throw jobError;
    return true;
  } finally {
    client.release(discard);
  }
};
