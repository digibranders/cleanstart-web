import * as migration_20260512_120000_baseline from './20260512_120000_baseline';

/**
 * Migration baseline established 2026-05-12.
 *
 * `20260512_120000_baseline` captures the *entire* schema at the
 * point where Payload migrations went live: every collection, every
 * global, every enum, every foreign key, every index. Regenerated
 * after the Phase J2 refactor that split the integrations.config
 * JSON blob into per-kind groups (teamsConfig, hubspotConfig, etc.).
 *
 * Workflow from this point forward:
 *   - All new schema changes generate their own migration via
 *     `pnpm --filter @cleanstart/cms migrate:create <name>`.
 *   - Each new migration is added to the array below in chronological
 *     order (Payload runs them in array order).
 *   - Production deploys run `pnpm migrate` before booting the Next
 *     app so the schema is current.
 *
 * For environments that already have the schema applied via `push: true`
 * (dev databases that pre-date this baseline), insert a row into the
 * `payload_migrations` table marking the baseline as already applied
 * so Payload doesn't try to re-create the tables:
 *
 *   INSERT INTO payload_migrations (name, batch, created_at, updated_at)
 *   VALUES ('20260512_120000_baseline', 1, now(), now());
 *
 * Fresh databases (CI, staging, prod cutover) run the baseline as the
 * first migration and the schema lands intact.
 */
export const migrations = [
  {
    up: migration_20260512_120000_baseline.up,
    down: migration_20260512_120000_baseline.down,
    name: '20260512_120000_baseline',
  },
];
