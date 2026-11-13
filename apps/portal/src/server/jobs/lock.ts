import type { Pool } from 'pg';

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
      throw error;
    }
    if (failed) throw jobError;
    return true;
  } finally {
    client.release(discard);
  }
};
