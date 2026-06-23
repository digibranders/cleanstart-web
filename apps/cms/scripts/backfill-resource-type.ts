#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Backfill `resources.typeRef` (relationship → resourceTypes) from the legacy
 * `type` select enum. Run AFTER seed-resource-types.ts, which creates one
 * resource-type doc per enum value (slug === enum value).
 *
 * For each resource: look up the resource-type doc whose `slug` equals the
 * doc's `type` enum value, and set `typeRef` to it. The legacy `type` enum is
 * left untouched (parallel transition) — apps/web reads the relationship; a
 * later migration removes the enum once verified live.
 *
 * SAFETY: idempotent. Skips a resource whose `typeRef` already points at the
 * correct type, and skips a resource with no `type` value (the enum is
 * optional). A `type` value with no matching doc is logged as UNMAPPED (never
 * guessed) — re-run seed-resource-types.ts first. `--dry-run` previews.
 *
 * Run from apps/cms with the env file loaded:
 *   pnpm exec tsx --env-file=.env scripts/backfill-resource-type.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/backfill-resource-type.ts
 *
 * PROD note: `payload.update` re-fires the resources afterChange hooks.
 * Teams/IndexNow are publish-transition-gated (no fire on re-save of a
 * published doc); the effects are a Meilisearch re-sync, a web revalidate,
 * and a version row per updated resource. Run in a quiet window.
 */
import { getPayload } from 'payload';

import config from '../src/payload.config.ts';

async function run(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');

  const payload = await getPayload({ config });

  const types = await payload.find({
    collection: 'resourceTypes',
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  });
  const idBySlug = new Map<string, string | number>();
  for (const t of types.docs as { id: string | number; slug?: string | null }[]) {
    if (t.slug) idBySlug.set(t.slug, t.id);
  }

  const resources = await payload.find({
    collection: 'resources',
    limit: 1000,
    depth: 0,
    draft: true,
    overrideAccess: true,
  });

  let updated = 0;
  let already = 0;
  let unmapped = 0;
  let noValue = 0;

  for (const res of resources.docs as {
    id: string | number;
    type?: string | null;
    typeRef?: string | number | { id: string | number } | null;
  }[]) {
    const value = res.type;
    if (!value) {
      noValue += 1;
      continue;
    }

    const targetId = idBySlug.get(value);
    if (targetId == null) {
      unmapped += 1;
      console.warn(`UNMAPPED ${res.id} — no resource-type doc for "${value}" (re-run seed first)`);
      continue;
    }

    const currentRef =
      typeof res.typeRef === 'object' && res.typeRef !== null ? res.typeRef.id : res.typeRef;
    if (currentRef === targetId) {
      already += 1;
      continue;
    }

    if (!dryRun) {
      await payload.update({
        collection: 'resources',
        id: res.id,
        data: { typeRef: targetId },
        overrideAccess: true,
      });
    }
    updated += 1;
    console.log(`${dryRun ? '[dry-run] ' : ''}set      ${res.id} → ${value}`);
  }

  console.log(
    `\nDone. ${resources.docs.length} scanned · ${updated} updated · ${already} already-correct · ${noValue} no-type · ${unmapped} unmapped.`,
  );
  process.exit(unmapped > 0 ? 2 : 0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
