/**
 * Backfill `knowledgeBase.videoUrl` for the Academy lesson videos.
 *
 * Sets the public MP4 URL on the 24 articles that have a lesson video (all in
 * the Understand section). Matches articles by slug against the extracted
 * manifest. Idempotent: only writes when the stored value differs.
 *
 * The `video_url` column must exist (Payload push locally; the
 * 20260608_153417_add_kb_video_url migration on deploy). Run after the seed.
 *
 *   pnpm exec tsx --env-file=.env scripts/backfill-knowledge-video.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/backfill-knowledge-video.ts
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { getPayload } from 'payload';

import config from '../src/payload.config.ts';
import { videoUrlForPath } from './data/kb-videos.ts';

interface ManifestArticle {
  slug: string;
  path: string;
  section: string;
}

const dryRun = process.argv.includes('--dry-run');

async function run(): Promise<void> {
  const payload = await getPayload({ config });
  const manifest: ManifestArticle[] = JSON.parse(
    readFileSync(resolve(import.meta.dirname, 'data/academy-kb.json'), 'utf8'),
  );

  let updated = 0;
  let skipped = 0;
  let missing = 0;

  for (const a of manifest) {
    const videoUrl = videoUrlForPath(a.path);
    if (!videoUrl) continue;

    // The 24 video articles are all in Understand with no slug collisions, so
    // the CMS slug equals the manifest slug.
    const found = await payload.find({
      collection: 'knowledgeBase',
      where: { slug: { equals: a.slug } },
      limit: 1,
      depth: 0,
    });
    const doc = found.docs[0];
    if (!doc) {
      missing += 1;
      payload.logger.warn(`no knowledgeBase doc for slug "${a.slug}" (${a.path})`);
      continue;
    }
    if (doc.videoUrl === videoUrl) {
      skipped += 1;
      continue;
    }
    if (!dryRun) {
      await payload.update({
        collection: 'knowledgeBase',
        id: doc.id,
        data: { videoUrl },
        overrideAccess: true,
      });
    }
    updated += 1;
    payload.logger.info(`${dryRun ? 'would set' : 'set'} videoUrl on knowledgeBase/${a.slug}`);
  }

  payload.logger.info(
    `video backfill ${dryRun ? '(dry-run) ' : ''}complete: ${updated} updated, ${skipped} already set, ${missing} missing`,
  );
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
