#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Backfill `case-studies.industryRef` (relationship → industries) from the
 * legacy `industry` select enum. Run AFTER seed-industries.ts, which creates
 * one industry doc per enum value (slug === enum value).
 *
 * For each case study: look up the industry doc whose `slug` equals the
 * doc's `industry` enum value, and set `industryRef` to it. The legacy
 * `industry` enum is left untouched (parallel transition) — apps/web reads
 * the relationship; a later migration removes the enum once verified live.
 *
 * SAFETY: idempotent. Skips a case study whose `industryRef` already points
 * at the correct industry. A case study whose `industry` value has no
 * matching industry doc is logged as UNMAPPED (never guessed) — re-run
 * seed-industries.ts first. `--dry-run` previews without writing.
 *
 * Run from apps/cms with the env file loaded:
 *   pnpm exec tsx --env-file=.env scripts/backfill-case-study-industry.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/backfill-case-study-industry.ts
 *
 * PROD note: `payload.update` re-fires the case-studies afterChange hooks.
 * Teams/IndexNow are publish-transition-gated (no fire on re-save of a
 * published doc); the effects are a Meilisearch re-sync, a web revalidate,
 * and a version row per updated case study. Run in a quiet window.
 */
import { getPayload } from 'payload';

import config from '../src/payload.config.ts';

async function run(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');

  const payload = await getPayload({ config });

  // Build slug → industry-id map once.
  const industries = await payload.find({
    collection: 'industries',
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  });
  const idBySlug = new Map<string, string | number>();
  for (const ind of industries.docs as { id: string | number; slug?: string | null }[]) {
    if (ind.slug) idBySlug.set(ind.slug, ind.id);
  }

  const caseStudies = await payload.find({
    collection: 'case-studies',
    limit: 1000,
    depth: 0,
    draft: true,
    overrideAccess: true,
  });

  let updated = 0;
  let already = 0;
  let unmapped = 0;

  for (const cs of caseStudies.docs as {
    id: string | number;
    industry?: string | null;
    industryRef?: string | number | { id: string | number } | null;
  }[]) {
    const value = cs.industry;
    if (!value) {
      console.log(`skip     ${cs.id} (no industry value)`);
      continue;
    }

    const targetId = idBySlug.get(value);
    if (targetId == null) {
      unmapped += 1;
      console.warn(`UNMAPPED ${cs.id} — no industry doc for "${value}" (re-run seed first)`);
      continue;
    }

    const currentRef =
      typeof cs.industryRef === 'object' && cs.industryRef !== null
        ? cs.industryRef.id
        : cs.industryRef;
    if (currentRef === targetId) {
      already += 1;
      continue;
    }

    if (!dryRun) {
      await payload.update({
        collection: 'case-studies',
        id: cs.id,
        data: { industryRef: targetId },
        overrideAccess: true,
      });
    }
    updated += 1;
    console.log(`${dryRun ? '[dry-run] ' : ''}set      ${cs.id} → ${value}`);
  }

  console.log(
    `\nDone. ${caseStudies.docs.length} scanned · ${updated} updated · ${already} already-correct · ${unmapped} unmapped.`,
  );
  process.exit(unmapped > 0 ? 2 : 0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
