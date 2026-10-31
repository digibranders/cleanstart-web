#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Moves the code catalog behind /videos (scripts/data/videos-catalog.json, a
 * snapshot of apps/web/src/lib/videos-catalog.ts) into the `videos` and
 * `videoTopics` collections, keeping every live slug.
 *
 * Order: topics, then videos (create what is missing, apply the catalog's
 * editorial fields and publish), then one YouTube sync pass to fill in the
 * synced snapshot (description, tags, thumbnails) from the channel's RSS feed.
 *
 * SAFETY: idempotent; a second run plans nothing. A slug already on a document
 * is a URL commitment, so a different slug (or a slug held by another video)
 * stops the run before anything is written. Dry run is the default.
 * Publish webhooks are skipped for the bulk write and web revalidation is
 * suppressed per document, then sent once at the end.
 *
 * Run from apps/cms with the env file loaded:
 *   pnpm exec tsx --env-file=.env scripts/seed-videos-from-catalog.ts
 *   pnpm exec tsx --env-file=.env scripts/seed-videos-from-catalog.ts --apply
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getPayload } from 'payload';

import config from '../src/payload.config.ts';
import { flushPendingAfterCommitEffects } from '../src/payload/lib/after-commit.ts';
import { resolveYoutubeCredentials } from '../src/payload/lib/integrations/credentials.ts';
import {
  type CatalogTopicSeed,
  type CatalogVideoSeed,
  type ExistingBackfillVideo,
  type ExistingTopic,
  planBackfill,
} from '../src/payload/lib/videos/plan-backfill.ts';
import { type RunSyncPayload, runYoutubeSync } from '../src/payload/lib/videos/run-sync.ts';
import { revalidateWeb } from '../src/payload/lib/web-revalidate.ts';
import { createYoutubeClient } from '../src/payload/lib/videos/youtube-client.ts';
import { createYoutubeRssClient } from '../src/payload/lib/videos/youtube-rss-client.ts';

type DocId = number | string;
type Doc = Record<string, unknown>;

const catalog = JSON.parse(
  readFileSync(fileURLToPath(new URL('./data/videos-catalog.json', import.meta.url)), 'utf8'),
) as { topics: CatalogTopicSeed[]; videos: CatalogVideoSeed[] };

const aliasRows = (aliases: readonly string[]): { value: string }[] => aliases.map((value) => ({ value }));
const refId = (ref: unknown): DocId | null => {
  if (ref && typeof ref === 'object') return (ref as { id?: DocId }).id ?? null;
  return typeof ref === 'string' || typeof ref === 'number' ? ref : null;
};

async function run(): Promise<void> {
  const apply = process.argv.includes('--apply');
  if (apply) process.env.WEB_REVALIDATE_SUPPRESS = 'true';
  const payload = await getPayload({ config });

  const readAll = async (collection: 'videos' | 'videoTopics'): Promise<Doc[]> => {
    const docs: Doc[] = [];
    for (let page = 1; ; page += 1) {
      const res = await payload.find({ collection, limit: 200, page, depth: 0, draft: true, overrideAccess: true });
      docs.push(...(res.docs as unknown as Doc[]));
      if (!res.hasNextPage) return docs;
    }
  };

  const loadExisting = async (): Promise<{
    topics: ExistingTopic[];
    topicIdBySlug: Map<string, DocId>;
    videos: ExistingBackfillVideo[];
  }> => {
    const [topicDocs, videoDocs] = await Promise.all([readAll('videoTopics'), readAll('videos')]);
    const topicSlugById = new Map(topicDocs.map((d) => [d.id as DocId, String(d.slug)]));
    return {
      topics: topicDocs.map((d) => ({
        id: d.id as DocId,
        slug: String(d.slug),
        name: String(d.name),
        aliases: ((d.aliases as { value?: string }[] | undefined) ?? []).flatMap((a) => (a.value ? [a.value] : [])),
      })),
      topicIdBySlug: new Map(topicDocs.map((d) => [String(d.slug), d.id as DocId])),
      videos: videoDocs.map((d) => ({
        id: d.id as DocId,
        externalId: String(d.externalId ?? ''),
        slug: typeof d.slug === 'string' && d.slug ? d.slug : null,
        title: typeof d.title === 'string' ? d.title : null,
        format: typeof d.format === 'string' ? d.format : null,
        topicSlugs: ((d.topics as unknown[] | undefined) ?? []).flatMap((t) => {
          const id = refId(t);
          const slug = id === null ? undefined : topicSlugById.get(id);
          return slug ? [slug] : [];
        }),
        summary: typeof d.summary === 'string' ? d.summary : null,
        status: d._status === 'published' ? ('published' as const) : ('draft' as const),
        syncState: typeof d.syncState === 'string' ? d.syncState : null,
      })),
    };
  };

  const describe = (plan: ReturnType<typeof planBackfill>): void => {
    payload.logger.info(
      {
        topicsCreate: plan.topics.create.length,
        topicsUpdate: plan.topics.update.length,
        topicsUnchanged: plan.topics.unchanged,
        videosCreate: plan.videos.create.length,
        videosUpdate: plan.videos.update.map((u) => `${u.video.slug}: ${u.reasons.join('+')}`),
        videosUnchanged: plan.videos.unchanged,
        conflicts: plan.videos.conflicts,
      },
      apply ? 'videos backfill plan' : 'videos backfill plan (dry run, pass --apply to write)',
    );
  };

  let existing = await loadExisting();
  let plan = planBackfill({
    catalogTopics: catalog.topics,
    catalogVideos: catalog.videos,
    existingTopics: existing.topics,
    existingVideos: existing.videos,
  });
  describe(plan);
  if (plan.videos.conflicts.length > 0) {
    payload.logger.error({ conflicts: plan.videos.conflicts }, 'slug conflicts, nothing written');
    process.exit(1);
  }
  if (!apply) process.exit(0);

  const write = { overrideAccess: true, depth: 0, context: { skipPublishWebhooks: true } } as const;

  for (const topic of plan.topics.create) {
    await payload.create({
      collection: 'videoTopics',
      data: { slug: topic.slug, name: topic.name, aliases: aliasRows(topic.aliases) },
      ...write,
    });
  }
  for (const { id, topic } of plan.topics.update) {
    await payload.update({
      collection: 'videoTopics',
      id,
      data: { name: topic.name, aliases: aliasRows(topic.aliases) },
      ...write,
    });
  }

  existing = await loadExisting();
  const topicIds = (slugs: readonly string[]): DocId[] =>
    slugs.map((slug) => {
      const id = existing.topicIdBySlug.get(slug);
      if (id === undefined) throw new Error(`Catalog topic "${slug}" has no videoTopics document`);
      return id;
    });
  const editorial = (v: CatalogVideoSeed): Doc => ({
    slug: v.slug,
    title: v.title,
    format: v.format,
    topics: topicIds(v.topics),
    summary: v.summary,
    syncState: 'synced',
    _status: 'published',
  });

  plan = planBackfill({
    catalogTopics: catalog.topics,
    catalogVideos: catalog.videos,
    existingTopics: existing.topics,
    existingVideos: existing.videos,
  });
  const fetchedAt = new Date().toISOString();
  for (const v of plan.videos.create) {
    await payload.create({
      collection: 'videos',
      data: {
        provider: 'youtube',
        externalId: v.externalId,
        ...editorial(v),
        source: {
          title: v.title,
          description: '',
          durationSeconds: v.durationSeconds,
          publishedAt: v.publishedAt,
          tags: [],
          privacyStatus: 'public',
          embeddable: true,
          hasMaxres: v.thumb === 'maxres',
          thumbnailUrl: `https://i.ytimg.com/vi/${v.externalId}/${v.thumb === 'maxres' ? 'maxresdefault' : 'hqdefault'}.jpg`,
          fetchedAt,
        },
      },
      ...write,
    });
  }
  for (const { id, video } of plan.videos.update) {
    await payload.update({ collection: 'videos', id, data: editorial(video), ...write });
  }

  // Fills description, tags and thumbnails; keeps the catalog's duration when the RSS feed has none.
  const creds = resolveYoutubeCredentials();
  const synced = await runYoutubeSync({
    payload: payload as unknown as RunSyncPayload,
    client: creds.apiKey ? createYoutubeClient({ apiKey: creds.apiKey }) : createYoutubeRssClient(),
    channelId: creds.channelId,
    autoPublish: false,
  });
  payload.logger.info(synced, 'videos backfill: sync pass done');

  await flushPendingAfterCommitEffects();
  process.env.WEB_REVALIDATE_SUPPRESS = 'false';
  const revalidated = await revalidateWeb(payload, {
    tags: ['videos'],
    paths: ['/videos', '/sitemap.xml', ...catalog.videos.map((v) => `/videos/${v.slug}`)],
  });
  payload.logger.info(revalidated, 'videos backfill: web revalidation');

  const after = planBackfill({
    catalogTopics: catalog.topics,
    catalogVideos: catalog.videos,
    ...(await loadExisting().then((e) => ({ existingTopics: e.topics, existingVideos: e.videos }))),
  });
  describe(after);
  process.exit(0);
}

run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
