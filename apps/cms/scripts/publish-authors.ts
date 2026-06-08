#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * One-time publish for the `authors` collection. The Webflow import
 * created every author in `draft` state, so none are published even
 * though their public `/author/[slug]` pages render. This flips every
 * non-published author to `published`.
 *
 * Idempotent: authors already `published` are skipped.
 *
 * Side effects (afterChange hooks fire on the draft -> published
 * transition — there is no context bypass for them):
 *   - search-sync     -> Meilisearch upsert (desired)
 *   - webhooks-publish -> Teams "document.published" card per author
 *   - indexnow-publish -> IndexNow ping per author URL (prod only, when
 *                         INDEXNOW_KEY is set and indexing is allowed)
 * Run in a quiet window. A version row is created per author.
 *
 * Local run (from apps/cms):
 *   node --env-file=.env --no-warnings --experimental-strip-types \
 *     scripts/publish-authors.ts --dry-run
 *   node --env-file=.env --no-warnings --experimental-strip-types \
 *     scripts/publish-authors.ts
 *
 * Prod run (inside the cms container, env already in the process):
 *   pnpm exec tsx scripts/publish-authors.ts --dry-run
 *   pnpm exec tsx scripts/publish-authors.ts
 */
import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';

const DRY_RUN = process.argv.includes('--dry-run');

const run = async (): Promise<void> => {
  const payload = await getPayload({ config: payloadConfig });

  const result = await payload.find({
    collection: 'authors',
    where: { _status: { not_equals: 'published' } },
    limit: 1000,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  });

  // eslint-disable-next-line no-console -- script output
  console.log(
    `${DRY_RUN ? '[dry-run] ' : ''}Found ${result.docs.length} non-published author(s).`,
  );

  let updated = 0;
  let errors = 0;

  for (const doc of result.docs) {
    const typed = doc as Record<string, unknown>;
    const id = typed.id as string | number;
    const name = typeof typed.name === 'string' ? typed.name : String(id);

    if (DRY_RUN) {
      // eslint-disable-next-line no-console -- script output
      console.log(`  would publish: ${name} (#${String(id)})`);
      continue;
    }

    try {
      await payload.update({
        collection: 'authors',
        id,
        data: { _status: 'published' } as Record<string, unknown>,
        overrideAccess: true,
      });
      updated += 1;
      // eslint-disable-next-line no-console -- script output
      console.log(`  published: ${name} (#${String(id)})`);
    } catch (err) {
      errors += 1;
      const message = err instanceof Error ? err.message : String(err);
      // eslint-disable-next-line no-console -- script output
      console.error(`  ! ${name} (#${String(id)}): ${message}`);
    }
  }

  // eslint-disable-next-line no-console -- script output
  console.log(
    `\nDone. ${DRY_RUN ? 'Would publish' : 'Published'} ${DRY_RUN ? result.docs.length : updated} author(s). Errors: ${errors}.`,
  );

  process.exit(errors > 0 ? 1 : 0);
};

run().catch((err: unknown) => {
  const message = err instanceof Error ? err.stack ?? err.message : String(err);
  // eslint-disable-next-line no-console -- script output
  console.error(message);
  process.exit(1);
});
