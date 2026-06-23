#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Seed the `industries` taxonomy from INDUSTRIES_SEED (mirrors the legacy
 * `case-studies.industry` enum). Part of the enum → taxonomy promotion:
 * run this BEFORE the backfill so every case study's enum value has a
 * matching industry doc to point at.
 *
 * SAFETY: idempotent / skip-safe. An industry whose `slug` already exists
 * is skipped (so a re-run never clobbers an editor edit), unless `--force`
 * is passed. `--dry-run` previews the plan without writing.
 *
 * The industries collection has no publish/IndexNow/search hooks of its
 * own (taxonomy), so this fires no external side effects. Each created doc
 * is published (`_status: 'published'`) so it is publicly readable.
 *
 * Run from apps/cms with the env file loaded:
 *   pnpm exec tsx --env-file=.env scripts/seed-industries.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/seed-industries.ts
 *   pnpm exec tsx --env-file=.env scripts/seed-industries.ts --force
 */
import { getPayload } from 'payload';

import config from '../src/payload.config.ts';
import { INDUSTRIES_SEED } from '../src/payload/lib/taxonomy-seed/industries-seed.ts';

async function run(): Promise<void> {
  const force = process.argv.includes('--force');
  const dryRun = process.argv.includes('--dry-run');

  const payload = await getPayload({ config });

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const term of INDUSTRIES_SEED) {
    const existing = await payload.find({
      collection: 'industries',
      where: { slug: { equals: term.slug } },
      limit: 1,
      overrideAccess: true,
    });

    const data = { name: term.name, slug: term.slug, _status: 'published' as const };

    if (existing.docs.length > 0) {
      const id = (existing.docs[0] as { id: string | number }).id;
      if (force) {
        if (!dryRun) {
          await payload.update({ collection: 'industries', id, data, overrideAccess: true });
        }
        updated += 1;
        console.log(`${dryRun ? '[dry-run] ' : ''}updated  ${term.slug}`);
      } else {
        skipped += 1;
        console.log(`skipped  ${term.slug} (exists)`);
      }
      continue;
    }

    if (!dryRun) {
      await payload.create({ collection: 'industries', data, overrideAccess: true });
    }
    created += 1;
    console.log(`${dryRun ? '[dry-run] ' : ''}created  ${term.slug}`);
  }

  console.log(
    `\nDone. ${INDUSTRIES_SEED.length} scanned · ${created} created · ${updated} updated · ${skipped} skipped.`,
  );
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
