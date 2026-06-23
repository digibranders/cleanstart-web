#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Seed the `pressTypes` taxonomy from PRESS_TYPES_SEED (mirrors the legacy
 * `news.pressType` enum). Run BEFORE backfill-news-press-type.ts.
 *
 * SAFETY: idempotent / skip-safe (skips an existing slug unless `--force`).
 * `--dry-run` previews. Each created doc is published. No external hooks.
 *
 *   pnpm exec tsx --env-file=.env scripts/seed-press-types.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/seed-press-types.ts
 */
import { getPayload } from 'payload';

import config from '../src/payload.config.ts';
import { PRESS_TYPES_SEED } from '../src/payload/lib/taxonomy-seed/press-types-seed.ts';

async function run(): Promise<void> {
  const force = process.argv.includes('--force');
  const dryRun = process.argv.includes('--dry-run');
  const payload = await getPayload({ config });

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const term of PRESS_TYPES_SEED) {
    const existing = await payload.find({
      collection: 'pressTypes',
      where: { slug: { equals: term.slug } },
      limit: 1,
      overrideAccess: true,
    });
    const data = { name: term.name, slug: term.slug, _status: 'published' as const };

    if (existing.docs.length > 0) {
      const id = (existing.docs[0] as { id: string | number }).id;
      if (force) {
        if (!dryRun)
          await payload.update({ collection: 'pressTypes', id, data, overrideAccess: true });
        updated += 1;
        console.log(`${dryRun ? '[dry-run] ' : ''}updated  ${term.slug}`);
      } else {
        skipped += 1;
        console.log(`skipped  ${term.slug} (exists)`);
      }
      continue;
    }

    if (!dryRun) await payload.create({ collection: 'pressTypes', data, overrideAccess: true });
    created += 1;
    console.log(`${dryRun ? '[dry-run] ' : ''}created  ${term.slug}`);
  }

  console.log(
    `\nDone. ${PRESS_TYPES_SEED.length} scanned · ${created} created · ${updated} updated · ${skipped} skipped.`,
  );
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
