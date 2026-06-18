#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Backfill `blogs.categories` from the Webflow export.
 *
 * The Webflow import transform captured `_rawCategories` (an array of
 * Webflow category IDs) but never resolved them to Payload category IDs
 * or set `categories` on each blog. This script carries the slug → category
 * mapping inline (derived from migrations/webflow-export/raw/blogs.jsonl
 * and categories.jsonl) so it runs in the prod container without needing
 * the migrations directory.
 *
 * 34 of 56 published blogs had no Webflow category — they are left with
 * categories: null (they appear under "All" in the filter). The remaining
 * 22 are assigned their original Webflow category.
 *
 * Idempotent: only writes when the resolved category differs from what's
 * stored. Re-runnable.
 *
 * Run from apps/cms with the env file loaded:
 *   pnpm exec tsx --env-file=.env scripts/backfill-blog-categories.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/backfill-blog-categories.ts
 *
 * PROD note: `payload.update` re-fires the blogs afterChange hooks. The
 * publish-transition-gated hooks (Teams/IndexNow) do NOT fire on a
 * re-save of an already-published blog, but Meilisearch re-syncs and a
 * version row is created per updated blog. Run in a quiet window.
 */
import { getPayload } from 'payload';
import payloadConfig from '../src/payload.config.ts';

const DRY_RUN = process.argv.includes('--dry-run');

/**
 * Derived from migrations/webflow-export/raw/blogs.jsonl +
 * migrations/webflow-export/raw/categories.jsonl.
 * Maps blog slug → Payload category slug (or null for no-category blogs).
 */
const BLOG_CATEGORY_MAP: Record<string, string | null> = {
  // application-security (6 blogs)
  'software-supply-chain-in-2026': 'application-security',
  'graboid-worm-the-docker-container-nightmare-that-taught-us-security-lessons': 'application-security',
  'codeql-compromised-how-public-secret-exposure-led-to-an-attack-9w4ro': 'application-security',
  'critical-nvidia-container-toolkit-vulnerability-cve-2025-23359': 'application-security',
  'supply-chain-attack-on-lottie-player-a-wake-up-call-for-javascript-security': 'application-security',
  'hidden-dangers-why-vulnerable-container-images-cost-more-than-you-think': 'application-security',
  // cyber-security (12 blogs)
  'built-in-compliance-cleanstarts-fips-foundations-series': 'cyber-security',
  'from-awareness-to-assurance-building-trust-in-a-cloud-native-ai-driven-world': 'cyber-security',
  '20m-malicious-pulls-when-automation-went-wrong': 'cyber-security',
  'typosquatted-alpine-a-devops-cautionary-tale': 'cyber-security',
  'software-supply-chain-security-a-technical-imperative-for-modern-ctos': 'cyber-security',
  'how-attackers-weaponized-trust-the-billion-download-npm-breach': 'cyber-security',
  'securing-the-software-supply-chain-how-distroless-containers-defend-against-npm-malware-attacks': 'cyber-security',
  'widespread-open-source-attack-malicious-code-identified-in-npm-pypi-and-rubygems-repositories': 'cyber-security',
  'the-evolution-of-cisos-from-network-guardians-to-product-security-leaders': 'cyber-security',
  'the-evolution-of-open-source-software-past-present-and-future-nb4zg': 'cyber-security',
  'busting-myths-about-open-source-and-containers': 'cyber-security',
  'empowering-development-securing-software-supply-chain-with-cleanstart': 'cyber-security',
  // data-protection (3 blogs)
  'addressing-rbis-guidelines-for-digital-payment-applications-with-cleanstart-i9e8q': 'data-protection',
  'container-image-signing-enhancing-security-in-the-software-supply-chain': 'data-protection',
  'the-recent-discovery-of-a-critical-vulnerability-in-nvidia': 'data-protection',
  // network-security (1 blog)
  'strengthening-software-supply-chain-security-with-slsa': 'network-security',
};

async function main(): Promise<void> {
  const payload = await getPayload({ config: payloadConfig });

  // Build Payload slug → ID map for categories.
  const catsResult = await payload.find({
    collection: 'categories',
    limit: 100,
    pagination: false,
  });
  const slugToPayloadId = new Map(catsResult.docs.map((c) => [c.slug as string, c.id as number]));

  // Fetch all published blogs.
  const blogsResult = await payload.find({
    collection: 'blogs',
    limit: 1000,
    pagination: false,
    where: { _status: { equals: 'published' } },
  });

  let filled = 0;
  let alreadySet = 0;
  let noCategory = 0;
  let unmapped = 0;

  for (const blog of blogsResult.docs) {
    const targetCatSlug = BLOG_CATEGORY_MAP[blog.slug as string];

    if (targetCatSlug === undefined) {
      // Blog not in our map — it's a CMS-only post without a Webflow origin.
      unmapped++;
      continue;
    }

    if (targetCatSlug === null) {
      noCategory++;
      continue;
    }

    const targetCatId = slugToPayloadId.get(targetCatSlug);
    if (!targetCatId) {
      payload.logger.warn({ msg: `Payload category not found for slug "${targetCatSlug}" — skipping blog "${blog.slug}"` });
      unmapped++;
      continue;
    }

    const currentCatId =
      blog.categories != null
        ? typeof blog.categories === 'object' && 'id' in (blog.categories as object)
          ? (blog.categories as { id: number }).id
          : (blog.categories as number)
        : null;

    if (currentCatId === targetCatId) {
      alreadySet++;
      continue;
    }

    if (DRY_RUN) {
      payload.logger.info({ msg: `[dry-run] blog#${blog.id} "${blog.slug}" → ${targetCatSlug} (id ${targetCatId})` });
    } else {
      await payload.update({
        collection: 'blogs',
        id: blog.id as number,
        data: { categories: targetCatId },
      });
      payload.logger.info({ msg: `✓ blog#${blog.id} "${blog.slug}" → ${targetCatSlug} (id ${targetCatId})` });
    }
    filled++;
  }

  payload.logger.info({
    msg: `Backfill${DRY_RUN ? ' (dry-run)' : ''} done: ${filled} ${DRY_RUN ? 'would fill' : 'filled'}, ${alreadySet} already-set, ${noCategory} no-webflow-category (null), ${unmapped} unmapped (CMS-only or missing cat).`,
  });

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
