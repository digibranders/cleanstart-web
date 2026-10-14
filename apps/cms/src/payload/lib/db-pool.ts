/**
 * Postgres connection-pool ceiling for the CMS process.
 *
 * Production Postgres runs with `max_connections = 20` (droplet tuning,
 * docs/operations/CMS-DEPLOYMENT.md step 6). The pool has to stay below that.
 * At 25 it did not: under a burst, such as a full web build prerendering ~600
 * pages, the pool opened connections Postgres refused, and those queries
 * failed with "too many clients already" instead of waiting for a free
 * connection. 15 also leaves room for backups, migrations and an operator's
 * psql session, which the CMS would otherwise crowd out because it connects
 * as the superuser and so can take the reserved slots too.
 *
 * Raise `max_connections` on the server before raising this.
 */
export const DEFAULT_DB_POOL_MAX = 15;

/** Resolves `DB_POOL_MAX`; a bad value fails at boot rather than reaching pg as NaN. */
export function resolveDbPoolMax(raw: string | undefined): number {
  const trimmed = raw?.trim() ?? '';
  if (trimmed === '') return DEFAULT_DB_POOL_MAX;
  const value = Number(trimmed);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`Invalid DB_POOL_MAX=${raw}: expected a positive integer.`);
  }
  return value;
}
