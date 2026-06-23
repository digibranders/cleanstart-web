#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Seed the `webinarTypes` taxonomy from WEBINAR_TYPES_SEED (mirrors the legacy
 * `webinars.webinarType` enum). Run BEFORE backfill-webinar-type.ts.
 *
 * SAFETY: idempotent / skip-safe (skips an existing slug unless `--force`).
 * `--dry-run` previews. Each created doc is published. No external hooks.
 *
 *   pnpm exec tsx --env-file=.env scripts/seed-webinar-types.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/seed-webinar-types.ts
 */
import { getPayload } from 'payload';

import config from '../src/payload.config.ts';
import { WEBINAR_TYPES_SEED } from '../src/payload/lib/taxonomy-seed/webinar-types-seed.ts';

async function run(): Promise<void> {
  const force = process.argv.includes('--force');
  const dryRun = process.argv.includes('--dry-run');
  const payload = await getPayload({ config });

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const term of WEBINAR_TYPES_SEED) {
    const existing = await payload.find({
      collection: 'webinarTypes',
      where: { slug: { equals: term.slug } },
      limit: 1,
      overrideAccess: true,
    });
    const data = { name: term.name, slug: term.slug, _status: 'published' as const };

    if (existing.docs.length > 0) {
      const id = (existing.docs[0] as { id: string | number }).id;
      if (force) {
        if (!dryRun)
          await payload.update({ collection: 'webinarTypes', id, data, overrideAccess: true });
        updated += 1;
        console.log(`${dryRun ? '[dry-run] ' : ''}updated  ${term.slug}`);
      } else {
        skipped += 1;
        console.log(`skipped  ${term.slug} (exists)`);
      }
      continue;
    }

    if (!dryRun) await payload.create({ collection: 'webinarTypes', data, overrideAccess: true });
    created += 1;
    console.log(`${dryRun ? '[dry-run] ' : ''}created  ${term.slug}`);
  }

  console.log(
    `\nDone. ${WEBINAR_TYPES_SEED.length} scanned · ${created} created · ${updated} updated · ${skipped} skipped.`,
  );
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
