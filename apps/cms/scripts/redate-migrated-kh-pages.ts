#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * One-shot: stamp the 52 migrated Knowledge Hub pages (guides and blogs) with
 * today's publish date. They carried the 9 June bulk-import date, which is not
 * an authoring date and kept them out of the listings and the nav feed.
 * Rows keep their sheet order, one second apart, so listing order is stable.
 *
 * In the prod container (copy scripts/data/kh-migration-map.json first):
 *   /app/node_modules/.bin/tsx scripts/redate-migrated-kh-pages.ts --dry-run
 *   /app/node_modules/.bin/tsx scripts/redate-migrated-kh-pages.ts
 */
import { readFileSync } from 'node:fs';

import { getPayload } from 'payload';

import { revalidateWeb } from '../src/payload/lib/web-revalidate.ts';
import payloadConfig from '../src/payload.config.ts';

interface MapRow {
  coll: 'guides' | 'blogs';
  newSlug: string;
}

const PREFIX = { guides: '/guide', blogs: '/blogs' } as const;

const log = (msg: string): void => {
  // eslint-disable-next-line no-console -- script output
  console.log(msg);
};

const run = async (): Promise<void> => {
  const dryRun = process.argv.includes('--dry-run');
  const rows = JSON.parse(
    readFileSync(new URL('./data/kh-migration-map.json', import.meta.url), 'utf8'),
  ) as MapRow[];
  const payload = await getPayload({ config: payloadConfig });
  const base = Date.now();
  const paths: string[] = [];
  for (const [i, row] of rows.entries()) {
    const res = await payload.find({
      collection: row.coll, where: { slug: { equals: row.newSlug } }, limit: 1, depth: 0, overrideAccess: true,
    });
    const doc = res.docs[0];
    if (!doc) throw new Error(`not found: ${row.coll}/${row.newSlug}`);
    const stamp = new Date(base - i * 1000).toISOString();
    log(`${dryRun ? 'would' : 'redate'}  ${row.coll}/${row.newSlug} -> ${stamp}`);
    if (dryRun) continue;
    await payload.update({
      collection: row.coll,
      id: doc.id,
      data: { publishedAt: stamp, displayPublishedAt: stamp } as never,
      overrideAccess: true,
      context: { skipPublishWebhooks: true },
    });
    paths.push(`${PREFIX[row.coll]}/${row.newSlug}`);
  }
  if (dryRun) return;
  const purge = await revalidateWeb(payload, {
    paths: [...paths, '/guide', '/blogs', '/sitemap.xml'],
    tags: ['resources-latest-updates'],
    layoutPaths: ['/'],
  });
  log(`purge    web cache: ${purge.ok ? 'ok' : `failed (${purge.status ?? purge.error ?? 'disabled'})`}`);
};

run()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    // eslint-disable-next-line no-console -- script output
    console.error(err);
    process.exit(1);
  });
