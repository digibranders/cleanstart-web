#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Backfill `webinars.webinarTypeRef` (relationship → webinarTypes) from the
 * legacy `webinarType` select enum. Run AFTER seed-webinar-types.ts.
 *
 * SAFETY: idempotent. Skips a doc whose `webinarTypeRef` is already correct or
 * whose `webinarType` is empty (it's a required enum, so empty is unlikely).
 * An unmapped value is logged (re-run seed first). `--dry-run` previews.
 *
 *   pnpm exec tsx --env-file=.env scripts/backfill-webinar-type.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/backfill-webinar-type.ts
 *
 * PROD note: `payload.update` re-fires the webinars afterChange hooks
 * (publish-transition-gated Teams/IndexNow won't fire on re-save; Meilisearch
 * re-sync + version row + web revalidate). Run in a quiet window.
 */
import { getPayload } from 'payload';

import config from '../src/payload.config.ts';

async function run(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const payload = await getPayload({ config });

  const types = await payload.find({
    collection: 'webinarTypes',
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  });
  const idBySlug = new Map<string, string | number>();
  for (const t of types.docs as { id: string | number; slug?: string | null }[]) {
    if (t.slug) idBySlug.set(t.slug, t.id);
  }

  const webinars = await payload.find({
    collection: 'webinars',
    limit: 1000,
    depth: 0,
    draft: true,
    overrideAccess: true,
  });

  let updated = 0;
  let already = 0;
  let unmapped = 0;
  let noValue = 0;

  for (const doc of webinars.docs as {
    id: string | number;
    webinarType?: string | null;
    webinarTypeRef?: string | number | { id: string | number } | null;
  }[]) {
    const value = doc.webinarType;
    if (!value) {
      noValue += 1;
      continue;
    }

    const targetId = idBySlug.get(value);
    if (targetId == null) {
      unmapped += 1;
      console.warn(`UNMAPPED ${doc.id} — no webinar-type doc for "${value}"`);
      continue;
    }

    const currentRef =
      typeof doc.webinarTypeRef === 'object' && doc.webinarTypeRef !== null
        ? doc.webinarTypeRef.id
        : doc.webinarTypeRef;
    if (currentRef === targetId) {
      already += 1;
      continue;
    }

    if (!dryRun) {
      await payload.update({
        collection: 'webinars',
        id: doc.id,
        data: { webinarTypeRef: targetId },
        overrideAccess: true,
      });
    }
    updated += 1;
    console.log(`${dryRun ? '[dry-run] ' : ''}set      ${doc.id} → ${value}`);
  }

  console.log(
    `\nDone. ${webinars.docs.length} scanned · ${updated} updated · ${already} already-correct · ${noValue} no-webinarType · ${unmapped} unmapped.`,
  );
  process.exit(unmapped > 0 ? 2 : 0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
