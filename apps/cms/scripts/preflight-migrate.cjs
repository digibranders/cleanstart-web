/**
 * Preflight cleanup invoked before `pnpm migrate` in the container CMD.
 *
 * Payload writes a row into `payload_migrations` with `batch = -1` (default
 * name `"dev"`) whenever an SDK call writes through the configured database
 * adapter while `process.env.NODE_ENV !== 'production'`. The row is harmless
 * to the schema — but Payload's drizzle migrate refuses to proceed when it
 * sees one and prints an interactive confirmation prompt:
 *
 *   "It looks like you've run Payload in dev mode, meaning you've dynamically
 *    pushed changes to your database. If you'd like to run migrations, data
 *    loss will occur. Would you like to proceed?"
 *
 * In a non-TTY container that prompt hangs forever, the `pnpm migrate` process
 * never exits, `pnpm start` never runs, port 3000 never binds, and Cloudflare
 * returns 502 until someone shells in and clears the row by hand (root-causing
 * a midnight outage — observed 2026-05-21).
 *
 * The marker rows are leaked by any ad-hoc tooling that authenticates to the
 * prod DB without `NODE_ENV=production` set — e.g. a developer running a
 * data-migration script from their laptop over an SSH tunnel. They're not
 * indicative of actual schema drift. Deleting them before every `pnpm migrate`
 * is safe, idempotent, and decouples container start from operator hygiene.
 *
 * On first boot the `payload_migrations` table doesn't exist yet — handled
 * via `to_regclass` so this script is also safe on a fresh DB.
 */
const { Client } = require('pg');

(async () => {
  const url = process.env.DATABASE_URI;
  if (!url) {
    console.error('[preflight-migrate] DATABASE_URI not set; skipping.');
    process.exit(0);
  }

  const client = new Client({ connectionString: url });
  try {
    await client.connect();

    const probe = await client.query("SELECT to_regclass('public.payload_migrations') AS t");
    if (!probe.rows[0] || probe.rows[0].t === null) {
      console.log('[preflight-migrate] payload_migrations table not present yet (first boot) — no-op.');
      return;
    }

    const res = await client.query(
      'DELETE FROM payload_migrations WHERE batch = -1 RETURNING name',
    );
    if (res.rowCount > 0) {
      const names = res.rows.map((r) => r.name).join(', ');
      console.log(
        `[preflight-migrate] cleared ${res.rowCount} db-push sentinel row(s): ${names}`,
      );
    } else {
      console.log('[preflight-migrate] no db-push sentinel rows to clear.');
    }
  } catch (err) {
    // Non-fatal: log and proceed. If a real batch=-1 row remains, `pnpm migrate`
    // will hang on the prompt — which is strictly the same failure mode as
    // before this script existed. A transient pg connect error here should not
    // block container start.
    console.error('[preflight-migrate] non-fatal error:', err && err.message ? err.message : err);
  } finally {
    await client.end().catch(() => {});
  }
})();
