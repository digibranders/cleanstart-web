/**
 * Seed for the `redirects` collection — 3 fixes found via a live Search
 * Console API audit (2026-07-07): two legacy URLs (`/cleanstart-raksha-chennai`,
 * `/webinar`) still earning search impressions while 404-ing, plus the redirect
 * for the just-deleted `/software-composition-analysis` orphan page.
 *
 * Data + validation live in
 * src/payload/lib/redirects/post-launch-redirects-seed.ts (typed const,
 * unit-tested). This is a distinct, smaller batch from the Phase H Webflow
 * migration seed (scripts/seed-redirects.ts) — written with `source: 'manual'`
 * rather than `migration-seed` so the two batches stay distinguishable in the
 * admin.
 *
 * SAFETY: idempotent. A row whose `from` already exists is **skipped** (so a
 * re-run never clobbers an edit made in the admin), unless `--force` is passed.
 * `--dry-run` reports the plan without writing.
 *
 * Run (inside the cms container, env mounted):
 *   pnpm exec tsx --env-file=.env scripts/seed-post-launch-redirects.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/seed-post-launch-redirects.ts
 *   pnpm exec tsx --env-file=.env scripts/seed-post-launch-redirects.ts --force
 *
 * Writing redirects fires no publish/IndexNow/search hooks (the collection has
 * none), so this is safe to run any time.
 */
import { getPayload } from 'payload';

import config from '../src/payload.config.ts';
import {
  POST_LAUNCH_REDIRECTS_SEED,
  assertRedirectSeedValid,
} from '../src/payload/lib/redirects/post-launch-redirects-seed.ts';

async function run(): Promise<void> {
  const force = process.argv.includes('--force');
  const dryRun = process.argv.includes('--dry-run');

  assertRedirectSeedValid(POST_LAUNCH_REDIRECTS_SEED);

  const payload = await getPayload({ config });

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const r of POST_LAUNCH_REDIRECTS_SEED) {
    const data = {
      from: r.from,
      to: r.to,
      status: r.status,
      source: 'manual' as const,
      ...(r.note ? { notes: r.note } : {}),
    };

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
    `post-launch redirects seed ${dryRun ? '(dry-run) ' : ''}complete: ${created} created, ${updated} updated, ${skipped} skipped (of ${POST_LAUNCH_REDIRECTS_SEED.length})`,
  );
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
