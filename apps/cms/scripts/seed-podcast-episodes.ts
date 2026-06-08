/**
 * Seed for the `podcastEpisodes` collection + the `podcastPage` global hero.
 *
 * Populates the Leadership Exchange podcast with the channel Introduction plus
 * the four launch episodes, mirroring the embeds on the current live site
 * (cleanstart.com/podcast). The Introduction is wired up as the global's
 * `featuredHeroEpisode` so it plays in the hero and is excluded from the
 * Latest Episodes grid (see apps/web/src/app/podcast/page.tsx).
 *
 * SAFETY: by default an episode whose `slug` already exists is **skipped**, so
 * re-running never clobbers content editors have since customized in the admin.
 * Pass `--force` to overwrite existing episodes with the seed content.
 * `--dry-run` reports the plan without writing.
 *
 * Run (inside the cms container, env injected):
 *   pnpm exec tsx scripts/seed-podcast-episodes.ts            # create-missing only
 *   pnpm exec tsx scripts/seed-podcast-episodes.ts --dry-run  # preview
 *   pnpm exec tsx scripts/seed-podcast-episodes.ts --force    # overwrite existing
 *
 * Locally (host Postgres):
 *   pnpm exec tsx --env-file=.env scripts/seed-podcast-episodes.ts
 *
 * First run publishes 5 episodes → IndexNow pings the 5 /podcast/episode URLs
 * (desired) and Meilisearch syncs (desired); the Teams publish webhook fires
 * once per episode (5 notifications) and a version row is created per doc.
 * Run in a quiet window. Idempotent.
 */
import { getPayload } from 'payload';

import config from '../src/payload.config.ts';

interface SeedEpisode {
  slug: string;
  title: string;
  episodeNumber: number;
  /** YouTube watch URL — the 11-char video ID is auto-extracted on save. */
  youtubeUrl: string;
  featured: boolean;
  /** ISO timestamp; drives the newest-first sort on /podcast. */
  publicationDate: string;
  /** When true, this episode is wired up as the podcastPage hero. */
  isHero?: boolean;
}

/**
 * Ordered so that the newest-first Latest Episodes grid renders Episode 1 → 4,
 * matching the current live site. The Introduction carries the newest date but
 * never appears in the grid (it is the hero and is filtered out on the web).
 */
const EPISODES: readonly SeedEpisode[] = [
  {
    slug: 'cleanstart-introduction',
    title: 'CleanStart Introduction',
    episodeNumber: 1,
    youtubeUrl: 'https://www.youtube.com/watch?v=F1V_xNvttmQ',
    featured: false,
    publicationDate: '2026-06-05T12:00:00.000Z',
    isHero: true,
  },
  {
    slug: 'from-stealth-to-spotlight',
    title: 'From Stealth to Spotlight',
    episodeNumber: 1,
    youtubeUrl: 'https://www.youtube.com/watch?v=nlIqS2UJq4Y',
    featured: false,
    publicationDate: '2026-06-04T12:00:00.000Z',
  },
  {
    slug: 'the-compliance-maze',
    title: 'The Compliance Maze',
    episodeNumber: 2,
    youtubeUrl: 'https://www.youtube.com/watch?v=YCXAnIfkxm8',
    featured: true,
    publicationDate: '2026-06-03T12:00:00.000Z',
  },
  {
    slug: 'demistify-software-supply-chain',
    title: 'Demistify Software Supply Chain',
    episodeNumber: 3,
    youtubeUrl: 'https://www.youtube.com/watch?v=6RUzP9novPk',
    featured: true,
    publicationDate: '2026-06-02T12:00:00.000Z',
  },
  {
    slug: 'what-most-teams-get-wrong-about-cves',
    title: 'What Most Teams get Wrong about CVEs',
    episodeNumber: 4,
    youtubeUrl: 'https://www.youtube.com/watch?v=FgdTLIAoARA',
    featured: false,
    publicationDate: '2026-06-01T12:00:00.000Z',
  },
];

async function run(): Promise<void> {
  const force = process.argv.includes('--force');
  const dryRun = process.argv.includes('--dry-run');
  const payload = await getPayload({ config });

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let heroId: string | number | null = null;

  for (const ep of EPISODES) {
    const existing = await payload.find({
      collection: 'podcastEpisodes',
      where: { slug: { equals: ep.slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });

    const data = {
      title: ep.title,
      slug: ep.slug,
      episodeNumber: ep.episodeNumber,
      youtubeUrl: ep.youtubeUrl,
      featured: ep.featured,
      publicationDate: ep.publicationDate,
      _status: 'published' as const,
    };

    const current = existing.docs[0];

    if (current) {
      if (ep.isHero) heroId = current.id;
      if (!force) {
        skipped += 1;
        payload.logger.info(`skipped podcastEpisodes/${ep.slug} (exists; pass --force to overwrite)`);
        continue;
      }
      if (!dryRun) {
        await payload.update({
          collection: 'podcastEpisodes',
          id: current.id,
          data,
          overrideAccess: true,
        });
      }
      updated += 1;
      payload.logger.info(`${dryRun ? 'would update' : 'updated'} podcastEpisodes/${ep.slug}`);
    } else {
      if (!dryRun) {
        const doc = await payload.create({
          collection: 'podcastEpisodes',
          data,
          overrideAccess: true,
        });
        if (ep.isHero) heroId = doc.id;
      }
      created += 1;
      payload.logger.info(`${dryRun ? 'would create' : 'created'} podcastEpisodes/${ep.slug}`);
    }
  }

  // Point the podcast hero at the Introduction. Only write when it differs, so a
  // re-run doesn't churn a new global version row for nothing.
  if (heroId !== null) {
    const globalDoc = await payload.findGlobal({
      slug: 'podcastPage',
      depth: 0,
      overrideAccess: true,
    });
    const rawHero = globalDoc.featuredHeroEpisode;
    const currentHero =
      rawHero && typeof rawHero === 'object' ? rawHero.id : (rawHero ?? null);
    if (currentHero === heroId) {
      payload.logger.info(`podcastPage.featuredHeroEpisode already set to ${heroId}`);
    } else if (dryRun) {
      payload.logger.info(`would set podcastPage.featuredHeroEpisode → ${heroId}`);
    } else {
      await payload.updateGlobal({
        slug: 'podcastPage',
        data: { featuredHeroEpisode: heroId },
        overrideAccess: true,
      });
      payload.logger.info(`set podcastPage.featuredHeroEpisode → ${heroId}`);
    }
  } else {
    payload.logger.warn('hero episode id unresolved — left podcastPage.featuredHeroEpisode untouched');
  }

  payload.logger.info(
    `podcast seed ${dryRun ? '(dry-run) ' : ''}complete: ${created} created, ${updated} updated, ${skipped} skipped`,
  );
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
