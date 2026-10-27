#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * One-shot: delete two Knowledge Hub articles and leave a 301 behind for each.
 * `no-shell-read-only` was a stub pointing at two other guides; `rekor-publishing`
 * is retired. The redirect is written first, so an indexed URL never 404s.
 * Idempotent: a missing article or an existing redirect is skipped.
 *
 * Dry run by default; `--apply` writes.
 * Local:   pnpm exec tsx --env-file=.env scripts/drop-knowledge-hub-pages.ts [--apply]
 * Prod container (env in process, no .env):
 *   /app/node_modules/.bin/tsx scripts/drop-knowledge-hub-pages.ts [--apply]
 */
import { getPayload } from 'payload';

import { revalidateWeb } from '../src/payload/lib/web-revalidate.ts';
import payloadConfig from '../src/payload.config.ts';

const APPLY = process.argv.includes('--apply');

const DROPS: ReadonlyArray<{ slug: string; to: string }> = [
  { slug: 'no-shell-read-only', to: '/knowledge-hub/combined-security-model' },
  { slug: 'rekor-publishing', to: '/knowledge-hub/image-signing-sigstore' },
];

const log = (msg: string): void => {
  // eslint-disable-next-line no-console -- script output
  console.log(`${APPLY ? '' : '[dry run] '}${msg}`);
};

async function run(): Promise<void> {
  const payload = await getPayload({ config: payloadConfig });
  const paths = ['/knowledge-hub'];

  for (const { slug, to } of DROPS) {
    const from = `/knowledge-hub/${slug}`;
    paths.push(from, to);

    const existing = await payload.find({
      collection: 'redirects',
      where: { from: { equals: from } },
      limit: 1,
      depth: 0,
    });
    if (existing.docs[0]) {
      log(`redirect ${from} already exists, skipped`);
    } else {
      log(`create 301 ${from} -> ${to}`);
      if (APPLY) {
        await payload.create({
          collection: 'redirects',
          data: {
            from,
            to,
            status: '301',
            source: 'archive-with-redirect',
            notes: 'Knowledge Hub article removed; sent to the closest remaining guide.',
          },
          overrideAccess: true,
        });
      }
    }

    const article = await payload.find({
      collection: 'knowledgeBase',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      draft: true,
    });
    const doc = article.docs[0];
    if (!doc) {
      log(`knowledgeBase/${slug} not found, skipped`);
      continue;
    }
    log(`delete knowledgeBase/${slug} (id ${doc.id}: ${doc.title})`);
    if (APPLY) {
      await payload.delete({ collection: 'knowledgeBase', id: doc.id, overrideAccess: true });
    }
  }

  if (APPLY) {
    const purge = await revalidateWeb(payload, { paths });
    log(`web revalidate: ${JSON.stringify(purge)}`);
  }
  process.exit(0);
}

run().catch((error: unknown) => {
  // eslint-disable-next-line no-console -- script output
  console.error(error);
  process.exit(1);
});
