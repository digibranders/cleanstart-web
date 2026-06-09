#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Force a FULL Meilisearch reindex (one-shot).
 *
 * The scheduled `meiliReindex` task only rebuilds when the Postgres↔Meili
 * doc COUNT drifts >5%. After the media rename the counts are unchanged
 * but the hero-image URLs baked into each search record are stale, so we
 * rebuild every published document unconditionally — reusing the exact
 * same schema/client the job uses.
 *
 * Run inside the prod cms container (env already present):
 *   docker exec -w /app/apps/cms cleanstart-cms-1 \
 *     pnpm dlx tsx scripts/reindex-search.ts
 */
import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';
import {
  type SearchDocument,
  createSearchClient,
  searchClientConfigFromEnv,
} from '../src/payload/lib/search/client.ts';
import {
  INDEX_UID,
  SEARCH_INDEXED_COLLECTIONS,
  buildSearchDocument,
  isIndexable,
} from '../src/payload/lib/search/index-schema.ts';
import { resolveSiteUrl } from '../src/payload/lib/site-url.ts';

const PAGE_SIZE = 100;

const run = async (): Promise<void> => {
  const payload = await getPayload({ config: payloadConfig });
  const client = createSearchClient(searchClientConfigFromEnv());
  if (!client.enabled) {
    payload.logger.error('Meilisearch client not configured (MEILISEARCH_URL / keys); aborting.');
    process.exit(1);
  }

  let baseUrl: string;
  try {
    const settings = (await payload.findGlobal({ slug: 'siteSettings' as never })) as { baseUrl?: string };
    baseUrl = resolveSiteUrl(settings?.baseUrl);
  } catch {
    baseUrl = resolveSiteUrl();
  }

  let reindexed = 0;
  let skipped = 0;
  let failed = 0;

  for (const collection of SEARCH_INDEXED_COLLECTIONS) {
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const result = await payload.find({
        collection: collection as never,
        where: { _status: { equals: 'published' } },
        limit: PAGE_SIZE,
        page,
        depth: 1,
        pagination: true,
      });
      const batch: SearchDocument[] = [];
      for (const raw of result.docs) {
        const doc = raw as Parameters<typeof isIndexable>[0];
        if (!isIndexable(doc)) {
          skipped += 1;
          continue;
        }
        const searchDoc = buildSearchDocument(
          baseUrl,
          collection,
          doc as Parameters<typeof buildSearchDocument>[2],
        );
        if (searchDoc) batch.push(searchDoc);
        else skipped += 1;
      }
      if (batch.length > 0) {
        const op = await client.upsertDocuments(INDEX_UID, batch);
        if (op.ok) {
          reindexed += batch.length;
        } else {
          failed += batch.length;
          payload.logger.warn(
            { collection, page, error: 'error' in op ? op.error : undefined },
            'reindex upsert failed',
          );
        }
      }
      hasMore = result.hasNextPage;
      page += 1;
    }
    payload.logger.info(`${collection}: done (running total reindexed ${reindexed})`);
  }

  payload.logger.info(`Full reindex complete: ${reindexed} reindexed, ${skipped} skipped, ${failed} failed.`);
  process.exit(failed > 0 ? 1 : 0);
};

run().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
