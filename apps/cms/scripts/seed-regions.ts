#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Seed the shared `regions` taxonomy from REGIONS_SEED (the union of the
 * legacy News + Webinars region enums). Run BEFORE backfill-region-ref.ts so
 * every story/webinar's enum value has a matching region doc to point at.
 *
 * SAFETY: idempotent / skip-safe (skips an existing slug unless `--force`).
 * `--dry-run` previews. Each created doc is published. No external hooks.
 *
 *   pnpm exec tsx --env-file=.env scripts/seed-regions.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/seed-regions.ts
 */
import { getPayload } from 'payload';

import config from '../src/payload.config.ts';
import { REGIONS_SEED } from '../src/payload/lib/taxonomy-seed/regions-seed.ts';

async function run(): Promise<void> {
  const force = process.argv.includes('--force');
  const dryRun = process.argv.includes('--dry-run');
  const payload = await getPayload({ config });

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const term of REGIONS_SEED) {
    const existing = await payload.find({
      collection: 'regions',
      where: { slug: { equals: term.slug } },
      limit: 1,
      overrideAccess: true,
    });
    const data = { name: term.name, slug: term.slug, _status: 'published' as const };

    if (existing.docs.length > 0) {
      const id = (existing.docs[0] as { id: string | number }).id;
      if (force) {
        if (!dryRun) await payload.update({ collection: 'regions', id, data, overrideAccess: true });
        updated += 1;
        console.log(`${dryRun ? '[dry-run] ' : ''}updated  ${term.slug}`);
      } else {
        skipped += 1;
        console.log(`skipped  ${term.slug} (exists)`);
      }
      continue;
    }

    if (!dryRun) await payload.create({ collection: 'regions', data, overrideAccess: true });
    created += 1;
    console.log(`${dryRun ? '[dry-run] ' : ''}created  ${term.slug}`);
  }

  console.log(
    `\nDone. ${REGIONS_SEED.length} scanned · ${created} created · ${updated} updated · ${skipped} skipped.`,
  );
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
