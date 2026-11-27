#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * One-shot: copy the Knowledge Hub lesson video URL onto the guide or blog that
 * replaced each article (scripts/data/kh-videos.json). Needs the `videoUrl`
 * column from migration 20261127_100000_guides_blogs_video_url.
 *
 * In the prod container (copy scripts/data/kh-videos.json first):
 *   /app/node_modules/.bin/tsx scripts/backfill-migrated-kh-videos.ts --dry-run
 *   /app/node_modules/.bin/tsx scripts/backfill-migrated-kh-videos.ts
 */
import { readFileSync } from 'node:fs';

import { getPayload } from 'payload';

import { revalidateWeb } from '../src/payload/lib/web-revalidate.ts';
import payloadConfig from '../src/payload.config.ts';

interface VideoRow {
  coll: 'guides' | 'blogs';
  slug: string;
  videoUrl: string;
}

const PREFIX = { guides: '/guide', blogs: '/blogs' } as const;

const log = (msg: string): void => {
  // eslint-disable-next-line no-console -- script output
  console.log(msg);
};

const run = async (): Promise<void> => {
  const dryRun = process.argv.includes('--dry-run');
  const rows = JSON.parse(
    readFileSync(new URL('./data/kh-videos.json', import.meta.url), 'utf8'),
  ) as VideoRow[];
  const payload = await getPayload({ config: payloadConfig });
  const paths: string[] = [];
  for (const row of rows) {
    const res = await payload.find({
      collection: row.coll, where: { slug: { equals: row.slug } }, limit: 1, depth: 0, overrideAccess: true,
    });
    const doc = res.docs[0] as unknown as { id: number; videoUrl?: string | null } | undefined;
    if (!doc) throw new Error(`not found: ${row.coll}/${row.slug}`);
    if (doc.videoUrl === row.videoUrl) {
      log(`skip     ${row.coll}/${row.slug} already set`);
      continue;
    }
    log(`${dryRun ? 'would' : 'set  '}    ${row.coll}/${row.slug}`);
    if (dryRun) continue;
    await payload.update({
      collection: row.coll,
      id: doc.id,
      data: { videoUrl: row.videoUrl } as never,
      overrideAccess: true,
      context: { skipPublishWebhooks: true },
    });
    paths.push(`${PREFIX[row.coll]}/${row.slug}`);
  }
  if (dryRun || paths.length === 0) return;
  const purge = await revalidateWeb(payload, { paths });
  log(`purge    web cache: ${purge.ok ? 'ok' : `failed (${purge.status ?? purge.error ?? 'disabled'})`}`);
};

run()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    // eslint-disable-next-line no-console -- script output
    console.error(err);
    process.exit(1);
  });
