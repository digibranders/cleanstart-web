/**
 * Seed for the `redirects` collection — the 26 legacy Webflow → new-site 301s.
 *
 * Data + validation live in src/payload/lib/webflow-import/redirects-seed.ts
 * (typed const, unit-tested). This must run **before the DNS cutover** so that
 * every inbound link / bookmark to an old Webflow URL 308/301-resolves to a live
 * page instead of 404-ing (permanent link-equity loss otherwise). The redirect
 * engine itself already exists: apps/web's proxy.ts reads this table.
 *
 * SAFETY: idempotent. A row whose `from` already exists is **skipped** (so a
 * re-run never clobbers an edit made in the admin), unless `--force` is passed.
 * `--dry-run` reports the plan without writing. The invariant guard runs first
 * and aborts on malformed data before any DB write.
 *
 * Each row is written with `source: 'migration-seed'` and a `notes` line carrying
 * its provenance. Four rows whose Webflow target no longer exists are remapped to
 * a live page (the note records the original target) — review them in the admin
 * (Content → SEO → Redirects) and adjust if a better destination exists. One row
 * targets a CMS blog slug; confirm that blog is published.
 *
 * Run (inside the cms container, env mounted):
 *   pnpm exec tsx --env-file=.env scripts/seed-redirects.ts --dry-run  # preview
 *   pnpm exec tsx --env-file=.env scripts/seed-redirects.ts            # create-missing
 *   pnpm exec tsx --env-file=.env scripts/seed-redirects.ts --force    # overwrite existing
 *
 * Writing redirects fires no publish/IndexNow/search hooks (the collection has
 * none), so this is safe to run any time. Idempotent.
 */
import { getPayload } from 'payload';

import config from '../src/payload.config.ts';
import {
  REDIRECTS_SEED,
  assertRedirectSeedValid,
} from '../src/payload/lib/webflow-import/redirects-seed.ts';

async function run(): Promise<void> {
  const force = process.argv.includes('--force');
  const dryRun = process.argv.includes('--dry-run');

  // Fail-fast on malformed seed data before touching the DB.
  assertRedirectSeedValid();

  const payload = await getPayload({ config });

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const remapped: string[] = [];

  for (const r of REDIRECTS_SEED) {
    const data = {
      from: r.from,
      to: r.to,
      status: r.status,
      source: 'migration-seed' as const,
      ...(r.note ? { notes: r.note } : {}),
    };

    if (r.originalTarget) {
      remapped.push(`${r.from} → ${r.to}  (was ${r.originalTarget})`);
    }

    const existing = await payload.find({
      collection: 'redirects',
      where: { from: { equals: r.from } },
      limit: 1,
      depth: 0,
    });

    if (existing.docs[0]) {
      if (!force) {
        skipped += 1;
        payload.logger.info(`skipped redirects/${r.from} (exists; pass --force to overwrite)`);
        continue;
      }
      if (!dryRun) {
        await payload.update({
          collection: 'redirects',
          id: existing.docs[0].id,
          data,
          overrideAccess: true,
        });
      }
      updated += 1;
      payload.logger.info(`${dryRun ? 'would update' : 'updated'} redirects/${r.from} → ${r.to}`);
    } else {
      if (!dryRun) {
        await payload.create({ collection: 'redirects', data, overrideAccess: true });
      }
      created += 1;
      payload.logger.info(`${dryRun ? 'would create' : 'created'} redirects/${r.from} → ${r.to}`);
    }
  }

  payload.logger.info(
    `redirects seed ${dryRun ? '(dry-run) ' : ''}complete: ${created} created, ${updated} updated, ${skipped} skipped (of ${REDIRECTS_SEED.length})`,
  );
  if (remapped.length > 0) {
    payload.logger.info(
      `⚠ ${remapped.length} rows were remapped from a dead Webflow target — review in admin:\n  ${remapped.join('\n  ')}`,
    );
  }
  payload.logger.info(
    '⚠ Also confirm the CMS blog slug /blogs/busybox-container-security-risk is published.',
  );
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
