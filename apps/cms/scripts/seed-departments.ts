#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Seed the `departments` taxonomy from DEPARTMENTS_SEED (mirrors the legacy
 * `jobs.department` enum). Part of the enum → taxonomy promotion: run this
 * BEFORE the backfill so every job's enum value has a matching department doc
 * to point at.
 *
 * SAFETY: idempotent / skip-safe. A department whose `slug` already exists is
 * skipped (so a re-run never clobbers an editor edit), unless `--force` is
 * passed. `--dry-run` previews the plan without writing.
 *
 * The departments collection has no publish/IndexNow/search hooks of its own
 * (taxonomy), so this fires no external side effects. Each created doc is
 * published (`_status: 'published'`) so it is publicly readable.
 *
 * Run from apps/cms with the env file loaded:
 *   pnpm exec tsx --env-file=.env scripts/seed-departments.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/seed-departments.ts
 *   pnpm exec tsx --env-file=.env scripts/seed-departments.ts --force
 */
import { getPayload } from 'payload';

import config from '../src/payload.config.ts';
import { DEPARTMENTS_SEED } from '../src/payload/lib/taxonomy-seed/departments-seed.ts';

async function run(): Promise<void> {
  const force = process.argv.includes('--force');
  const dryRun = process.argv.includes('--dry-run');

  const payload = await getPayload({ config });

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const term of DEPARTMENTS_SEED) {
    const existing = await payload.find({
      collection: 'departments',
      where: { slug: { equals: term.slug } },
      limit: 1,
      overrideAccess: true,
    });

    const data = { name: term.name, slug: term.slug, _status: 'published' as const };

    if (existing.docs.length > 0) {
      const id = (existing.docs[0] as { id: string | number }).id;
      if (force) {
        if (!dryRun) {
          await payload.update({ collection: 'departments', id, data, overrideAccess: true });
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
      await payload.create({ collection: 'departments', data, overrideAccess: true });
    }
    created += 1;
    console.log(`${dryRun ? '[dry-run] ' : ''}created  ${term.slug}`);
  }

  console.log(
    `\nDone. ${DEPARTMENTS_SEED.length} scanned · ${created} created · ${updated} updated · ${skipped} skipped.`,
  );
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
