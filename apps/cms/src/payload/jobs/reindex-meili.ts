import type { TaskConfig } from 'payload';

import {
  INDEX_SETTINGS,
  INDEX_UID,
  SEARCH_INDEXED_COLLECTIONS,
  buildSearchDocument,
  isIndexable,
} from '../lib/search/index-schema';
import {
  type SearchDocument,
  createSearchClient,
  searchClientConfigFromEnv,
} from '../lib/search/client';
import { resolveSiteUrl } from '../lib/site-url';

/** Reindex when Meilisearch doc count drifts more than 5% from Postgres. */
const DRIFT_THRESHOLD = 0.05;
/** Docs fetched per Payload `find` page during a full reindex. */
const PAGE_SIZE = 100;

interface ReindexPayload {
  find: (args: {
    collection: string;
    where?: Record<string, unknown>;
    limit: number;
    page?: number;
    depth: number;
    pagination: boolean;
  }) => Promise<{ docs: unknown[]; totalDocs: number; hasNextPage: boolean }>;
  findGlobal: (args: { slug: 'siteSettings' }) => Promise<unknown>;
  logger?: {
    info?: (meta: Record<string, unknown>, msg: string) => void;
    warn?: (meta: Record<string, unknown>, msg: string) => void;
  };
}

const readBaseUrl = async (payload: ReindexPayload): Promise<string> => {
  try {
    const settings = (await payload.findGlobal({ slug: 'siteSettings' })) as {
      baseUrl?: string;
    };
    return resolveSiteUrl(settings.baseUrl);
  } catch {
    return resolveSiteUrl();
  }
};

export const reindexMeiliTask: TaskConfig<'meiliReindex'> = {
  slug: 'meiliReindex',
  retries: 0,
  schedule: [{ cron: '0 5 * * *', queue: 'meiliReindex' }],
  handler: async ({ req }) => {
    const payload = req.payload as unknown as ReindexPayload;
    const client = createSearchClient(searchClientConfigFromEnv());

    if (!client.enabled) {
      return {
        output: {
          postgresCount: 0,
          meiliCount: 0,
          delta: 0,
          reindexed: 0,
          skipped: 0,
          reason: 'client-not-configured',
        },
      };
    }

    // --- 0. Ensure index settings (searchable + filterable + ranking). ---
    // Idempotent and cheap; applied on every run so a fresh or drifted index
    // always has the filterable attributes (`isPublished`, `collection`) the
    // public /api/search endpoint relies on — without this the filtered
    // search errors and returns nothing even when documents are present.
    await client.updateSettings(INDEX_UID, INDEX_SETTINGS);

    // --- 1. Query Meilisearch for current index doc count ---
    const stats = await client.getStats(INDEX_UID);
    const meiliCount = stats?.numberOfDocuments ?? -1;

    // --- 2. Count published docs in Postgres ---
    let postgresCount = 0;
    for (const collection of SEARCH_INDEXED_COLLECTIONS) {
      const { totalDocs } = await payload.find({
        collection,
        where: { _status: { equals: 'published' } },
        limit: 0,
        depth: 0,
        pagination: true,
      });
      postgresCount += totalDocs;
    }

    // --- 3. Decide whether drift warrants a full reindex ---
    const delta =
      meiliCount < 0
        ? 1
        : Math.abs(postgresCount - meiliCount) / Math.max(postgresCount, 1);
    const needsReindex = meiliCount < 0 || delta > DRIFT_THRESHOLD;

    payload.logger?.info?.(
      { postgresCount, meiliCount, delta: Math.round(delta * 1000) / 10, needsReindex },
      'meiliReindex.stats',
    );

    if (!needsReindex) {
      return {
        output: {
          postgresCount,
          meiliCount,
          delta,
          reindexed: 0,
          skipped: postgresCount,
        },
      };
    }

    // --- 4. Full reindex ---
    const baseUrl = await readBaseUrl(payload);
    let reindexed = 0;
    let skipped = 0;

    for (const collection of SEARCH_INDEXED_COLLECTIONS) {
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const result = await payload.find({
          collection,
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
          const opResult = await client.upsertDocuments(INDEX_UID, batch);
          if (opResult.ok) {
            reindexed += batch.length;
          } else {
            payload.logger?.warn?.(
              { collection, page, error: 'error' in opResult ? opResult.error : undefined },
              'meiliReindex.upsert failed',
            );
            skipped += batch.length;
          }
        }

        hasMore = result.hasNextPage;
        page += 1;
      }
    }

    payload.logger?.info?.(
      { postgresCount, meiliCount, delta, reindexed, skipped },
      'meiliReindex.complete',
    );

    return { output: { postgresCount, meiliCount, delta, reindexed, skipped } };
  },
};
