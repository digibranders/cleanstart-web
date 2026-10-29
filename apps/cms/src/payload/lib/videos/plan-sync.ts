import { createHash } from 'node:crypto';

import type { YoutubeVideo } from './youtube-client';

export type SyncState = 'synced' | 'needs-review' | 'missing' | 'manual';
export type SkipReason = 'not-public' | 'not-embeddable' | 'not-finished';
export type DocId = number | string;
export type VideoFormat = 'explainer' | 'demo';

export interface SourceSnapshot {
  readonly title: string;
  readonly description: string;
  readonly durationSeconds: number | null;
  readonly publishedAt: string;
  readonly tags: readonly string[];
  readonly privacyStatus: string;
  readonly embeddable: boolean;
  readonly hasMaxres: boolean;
  readonly thumbnailUrl: string;
}

export interface ExistingVideo {
  readonly id: DocId;
  readonly externalId: string;
  readonly syncState: SyncState;
  readonly contentHash: string | null;
  readonly status: 'draft' | 'published';
  /** What the document already stores, so an RSS run (which knows no duration) never erases it. */
  readonly durationSeconds: number | null;
}

export interface TopicRef {
  readonly id: DocId;
  readonly name: string;
  readonly aliases: readonly string[];
}

export interface SyncPlan {
  readonly creates: {
    externalId: string;
    source: SourceSnapshot;
    suggestedTopicIds: DocId[];
    suggestedFormat: VideoFormat | null;
  }[];
  readonly updates: { id: DocId; source: SourceSnapshot; restoreFromMissing: boolean }[];
  readonly unchanged: number;
  readonly missing: DocId[];
  readonly skipped: { externalId: string; reason: SkipReason }[];
}

export const normaliseTag = (raw: string): string => raw.toLowerCase().replace(/[^a-z0-9]/g, '');

export const toSource = (v: YoutubeVideo): SourceSnapshot => ({
  title: v.title,
  description: v.description,
  durationSeconds: v.durationSeconds,
  publishedAt: v.publishedAt,
  tags: v.tags,
  privacyStatus: v.privacyStatus,
  embeddable: v.embeddable,
  hasMaxres: v.hasMaxres,
  thumbnailUrl: `https://i.ytimg.com/vi/${v.id}/${v.hasMaxres ? 'maxresdefault' : 'hqdefault'}.jpg`,
});

/** Unknown (null) never overwrites a duration we already have. */
export const withKnownDuration = (source: SourceSnapshot, existing: number | null): SourceSnapshot =>
  source.durationSeconds === null && existing !== null ? { ...source, durationSeconds: existing } : source;

export const contentHash = (source: SourceSnapshot): string =>
  createHash('sha256').update(JSON.stringify(source)).digest('hex');

// A hashtag must start a word, so "page#vex" in a URL fragment is not one.
const HASHTAG = /(?:^|\s)#([\p{L}\p{N}_]+)/gu;

export const suggestTopicIds = (
  input: { tags: readonly string[]; description: string },
  topics: readonly TopicRef[],
): DocId[] => {
  const candidates = new Set<string>([
    ...input.tags.map(normaliseTag),
    ...[...input.description.matchAll(HASHTAG)].map((m) => normaliseTag(m[1] ?? '')),
  ]);
  return topics
    .filter((t) => [t.name, ...t.aliases].some((label) => candidates.has(normaliseTag(label))))
    .map((t) => t.id);
};

const skipReason = (v: YoutubeVideo): SkipReason | null => {
  if (v.privacyStatus !== 'public') return 'not-public';
  if (!v.embeddable) return 'not-embeddable';
  if (v.liveBroadcastContent !== 'none') return 'not-finished';
  return null;
};

export const planSync = ({
  existing,
  fetched,
  complete,
  topics,
  formatByVideoId = new Map(),
}: {
  existing: readonly ExistingVideo[];
  fetched: readonly YoutubeVideo[];
  complete: boolean;
  topics: readonly TopicRef[];
  formatByVideoId?: ReadonlyMap<string, VideoFormat>;
}): SyncPlan => {
  const byExternalId = new Map(existing.map((e) => [e.externalId, e]));
  const seen = new Set<string>();
  const creates: SyncPlan['creates'] = [];
  const updates: SyncPlan['updates'] = [];
  const skipped: SyncPlan['skipped'] = [];
  let unchanged = 0;

  for (const v of fetched) {
    seen.add(v.id);
    const reason = skipReason(v);
    if (reason) {
      skipped.push({ externalId: v.id, reason });
      continue;
    }
    const current = byExternalId.get(v.id);
    const source = withKnownDuration(toSource(v), current?.durationSeconds ?? null);
    if (!current) {
      creates.push({
        externalId: v.id,
        source,
        suggestedTopicIds: suggestTopicIds({ tags: v.tags, description: v.description }, topics),
        suggestedFormat: formatByVideoId.get(v.id) ?? null,
      });
    } else if (current.syncState === 'manual') {
      unchanged += 1;
    } else if (current.contentHash === contentHash(source) && current.syncState !== 'missing') {
      unchanged += 1;
    } else {
      updates.push({ id: current.id, source, restoreFromMissing: current.syncState === 'missing' });
    }
  }

  const missing = complete
    ? existing
        .filter((e) => e.syncState !== 'manual' && e.syncState !== 'missing' && !seen.has(e.externalId))
        .map((e) => e.id)
    : [];

  return { creates, updates, unchanged, missing, skipped };
};
