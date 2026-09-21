#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Seed the detail-page fields added by
 * `20260921_100000_add_case_study_detail_fields` for the three case studies
 * that predate them.
 *
 * Every value below is already published on the site — the figures come out of
 * each study's own CMS `summary`, the quotes out of the approved testimonials
 * on the home page. Nothing here is new copy, and no figure is invented: this
 * moves published claims into the fields the detail page reads so editors own
 * them, instead of the web app carrying them in a TypeScript constant.
 *
 * Studies not listed are left alone. A study whose target fields are already
 * populated is skipped, so this is safe to re-run.
 *
 * Run from apps/cms with the env file loaded:
 *   pnpm exec tsx --env-file=.env scripts/backfill-case-study-detail-fields.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/backfill-case-study-detail-fields.ts
 *
 * PROD note: `payload.update` re-fires the case-studies afterChange hooks.
 * IndexNow and Teams are publish-transition-gated, so a re-save of an already
 * published doc does not fire them; the effects are a Meilisearch re-sync, a
 * web revalidate, and one version row per study. Run in a quiet window.
 */
import { getPayload } from 'payload';

import config from '../src/payload.config.ts';

interface Seed {
  readonly slug: string;
  readonly outcomes?: { value: string; label: string }[];
  readonly glance?: { label: string; value: string }[];
  readonly quote?: { text: string; author: string; role: string };
}

const SEEDS: readonly Seed[] = [
  {
    // Figures quoted from this study's own summary: "…built with zero known
    // CVEs…delivering up to 88% less vulnerability noise and up to 3× faster
    // path to secure deployment."
    slug: 'o9-solutions-adopted-a-verified-container-foundation',
    outcomes: [
      { value: 'Up to 88%', label: 'less vulnerability noise' },
      { value: 'Up to 3x', label: 'faster path to secure deployment' },
      { value: 'Zero', label: 'known CVEs in the new image set' },
    ],
    glance: [
      { label: 'Migrated from', value: 'Bitnami images' },
      { label: 'Environment', value: 'Cloud-native, at scale' },
    ],
  },
  {
    slug: 'how-iifl-finance-standardized-secure-container-foundations',
    quote: {
      text: 'CleanStart helped us standardize our container foundations without slowing development. Tasks that previously required significant manual effort are now eliminated, deployments are faster, and our security team has greater confidence in the images we use.',
      author: 'Shanker Ramrakhiani',
      role: 'Head, Risk and App Security, IIFL Finance',
    },
  },
  {
    slug: 'streamlining-operations-for-a-leading-healthcare-provider',
    quote: {
      text: 'Standardizing on verified container foundations gave us confidence in the base of every service we deploy and allowed us to shift security much earlier in the build process.',
      author: 'Mr. Moinul Khan',
      role: 'CEO, Aurascape',
    },
  },
];

type CaseStudyRow = {
  id: string | number;
  slug?: string | null;
  outcomes?: unknown[] | null;
  glance?: unknown[] | null;
  quote?: string | null;
};

async function run(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const payload = await getPayload({ config });

  let updated = 0;
  let skipped = 0;
  let missing = 0;

  for (const seed of SEEDS) {
    const found = await payload.find({
      collection: 'case-studies',
      where: { slug: { equals: seed.slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const doc = found.docs[0] as CaseStudyRow | undefined;
    if (!doc) {
      console.warn(`MISSING  ${seed.slug}`);
      missing += 1;
      continue;
    }

    // Only fill what is empty. An editor's own wording always wins.
    const data: Record<string, unknown> = {};
    if (seed.outcomes && (doc.outcomes?.length ?? 0) === 0) data.outcomes = seed.outcomes;
    if (seed.glance && (doc.glance?.length ?? 0) === 0) data.glance = seed.glance;
    if (seed.quote && !doc.quote?.trim()) {
      data.quote = seed.quote.text;
      data.quoteAuthor = seed.quote.author;
      data.quoteRole = seed.quote.role;
    }

    if (Object.keys(data).length === 0) {
      console.log(`SKIP     ${seed.slug} (already populated)`);
      skipped += 1;
      continue;
    }

    console.log(`${dryRun ? 'WOULD   ' : 'UPDATE  '} ${seed.slug} → ${Object.keys(data).join(', ')}`);
    if (!dryRun) {
      await payload.update({
        collection: 'case-studies',
        id: doc.id,
        data,
        overrideAccess: true,
      });
    }
    updated += 1;
  }

  console.log(
    `\n${dryRun ? 'Dry run. ' : ''}${updated} to update, ${skipped} already populated, ${missing} not found.`,
  );
  process.exit(0);
}

run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
