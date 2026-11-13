import type { Pool } from 'pg';

/** Returns false without running `fn` when another connection already holds the lock for `name`. */
export const runLocked = async (pool: Pool, name: string, fn: () => Promise<void>): Promise<boolean> => {
  const key = `portal:${name}`;
  const client = await pool.connect();
  try {
    const { rows } = await client.query<{ ok: boolean }>('select pg_try_advisory_lock(hashtext($1)) as ok', [key]);
    if (!rows[0]?.ok) return false;
    try {
      await fn();
      return true;
    } finally {
      await client.query('select pg_advisory_unlock(hashtext($1))', [key]);
    }
  } finally {
    client.release();
  }
};
