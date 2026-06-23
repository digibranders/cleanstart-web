#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Backfill `news.pressTypeRef` (relationship → pressTypes) from the legacy
 * `pressType` select enum. Run AFTER seed-press-types.ts.
 *
 * SAFETY: idempotent. Skips a doc whose `pressTypeRef` is already correct or
 * whose `pressType` is empty. An unmapped value is logged (re-run seed first).
 * `--dry-run` previews.
 *
 *   pnpm exec tsx --env-file=.env scripts/backfill-news-press-type.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/backfill-news-press-type.ts
 *
 * PROD note: `payload.update` re-fires the news afterChange hooks
 * (publish-transition-gated Teams/IndexNow won't fire on re-save; Meilisearch
 * re-sync + version row + web revalidate). Run in a quiet window.
 */
import { getPayload } from 'payload';

import config from '../src/payload.config.ts';

async function run(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const payload = await getPayload({ config });

  const types = await payload.find({
    collection: 'pressTypes',
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  });
  const idBySlug = new Map<string, string | number>();
  for (const t of types.docs as { id: string | number; slug?: string | null }[]) {
    if (t.slug) idBySlug.set(t.slug, t.id);
  }

  const news = await payload.find({
    collection: 'news',
    limit: 1000,
    depth: 0,
    draft: true,
    overrideAccess: true,
  });

  let updated = 0;
  let already = 0;
  let unmapped = 0;
  let noValue = 0;

  for (const doc of news.docs as {
    id: string | number;
    pressType?: string | null;
    pressTypeRef?: string | number | { id: string | number } | null;
  }[]) {
    const value = doc.pressType;
    if (!value) {
      noValue += 1;
      continue;
    }

    const targetId = idBySlug.get(value);
    if (targetId == null) {
      unmapped += 1;
      console.warn(`UNMAPPED ${doc.id} — no press-type doc for "${value}"`);
      continue;
    }

    const currentRef =
      typeof doc.pressTypeRef === 'object' && doc.pressTypeRef !== null
        ? doc.pressTypeRef.id
        : doc.pressTypeRef;
    if (currentRef === targetId) {
      already += 1;
      continue;
    }

    if (!dryRun) {
      await payload.update({
        collection: 'news',
        id: doc.id,
        data: { pressTypeRef: targetId },
        overrideAccess: true,
      });
    }
    updated += 1;
    console.log(`${dryRun ? '[dry-run] ' : ''}set      ${doc.id} → ${value}`);
  }

  console.log(
    `\nDone. ${news.docs.length} scanned · ${updated} updated · ${already} already-correct · ${noValue} no-pressType · ${unmapped} unmapped.`,
  );
  process.exit(unmapped > 0 ? 2 : 0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
