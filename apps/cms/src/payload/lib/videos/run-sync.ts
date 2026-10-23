import { type ApplyResult, type SyncPayload, applyPlan } from './apply-sync';
import { type DocId, type ExistingVideo, type SyncState, type TopicRef, planSync } from './plan-sync';
import type { YoutubeClient } from './youtube-client';

export interface RunSyncPayload extends SyncPayload {
  find(args: {
    collection: 'videos' | 'videoTopics';
    limit: number;
    page: number;
    depth: number;
    draft?: boolean;
    overrideAccess: boolean;
  }): Promise<{ docs: Record<string, unknown>[]; hasNextPage?: boolean }>;
}

export interface RunSyncResult extends ApplyResult {
  unchanged: number;
  skipped: number;
  fetched: number;
  /** False in RSS mode: the feed cannot prove a video is gone, so nothing is flagged missing. */
  complete: boolean;
}

const PAGE_SIZE = 200;
const MAX_PAGES = 50;

const readAll = async (
  payload: RunSyncPayload,
  collection: 'videos' | 'videoTopics',
  draft: boolean,
): Promise<Record<string, unknown>[]> => {
  const out: Record<string, unknown>[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const res = await payload.find({ collection, limit: PAGE_SIZE, page, depth: 0, draft, overrideAccess: true });
    out.push(...res.docs);
    if (!res.hasNextPage) return out;
  }
  return out;
};

const asNumber = (value: unknown): number | null => (typeof value === 'number' ? value : null);

const toExisting = (doc: Record<string, unknown>): ExistingVideo | null => {
  const externalId = doc.externalId;
  if (typeof externalId !== 'string' || externalId.length === 0) return null;
  const source = (doc.source ?? {}) as { contentHash?: unknown; durationSeconds?: unknown };
  return {
    id: doc.id as DocId,
    externalId,
    syncState: (doc.syncState as SyncState | undefined) ?? 'manual',
    contentHash: typeof source.contentHash === 'string' ? source.contentHash : null,
    status: doc._status === 'published' ? 'published' : 'draft',
    durationSeconds: asNumber(source.durationSeconds),
  };
};

const toTopic = (doc: Record<string, unknown>): TopicRef => ({
  id: doc.id as DocId,
  name: String(doc.name ?? ''),
  aliases: ((doc.aliases as { value?: string }[] | undefined) ?? []).flatMap((a) => (a.value ? [a.value] : [])),
});

export const runYoutubeSync = async ({
  payload,
  client,
  channelId,
  autoPublish,
}: {
  payload: RunSyncPayload;
  client: YoutubeClient;
  channelId: string;
  autoPublish: boolean;
}): Promise<RunSyncResult> => {
  // Order matters: the RSS client reads its whole feed in listUploadIds.
  const { ids, complete } = await client.listUploadIds(channelId);
  const fetched = await client.getVideos(ids);

  // draft: true reads the latest version, so a draft-only import is seen as existing.
  const [existingDocs, topicDocs] = await Promise.all([
    readAll(payload, 'videos', true),
    readAll(payload, 'videoTopics', false),
  ]);
  const existing = existingDocs.flatMap((d) => {
    const e = toExisting(d);
    return e ? [e] : [];
  });

  const plan = planSync({ existing, fetched, complete, topics: topicDocs.map(toTopic) });
  const applied = await applyPlan(payload, plan, { autoPublish });
  return { ...applied, unchanged: plan.unchanged, skipped: plan.skipped.length, fetched: fetched.length, complete };
};
