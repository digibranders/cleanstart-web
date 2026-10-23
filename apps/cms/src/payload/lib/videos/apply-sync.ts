import { type DocId, type SourceSnapshot, type SyncPlan, contentHash } from './plan-sync';

export interface SyncPayload {
  create(args: {
    collection: 'videos';
    data: Record<string, unknown>;
    draft: boolean;
    overrideAccess: boolean;
    depth: number;
  }): Promise<{ id: DocId }>;
  update(args: {
    collection: 'videos';
    id: DocId;
    data: Record<string, unknown>;
    overrideAccess: boolean;
    depth: number;
  }): Promise<unknown>;
  logger: {
    info(meta: Record<string, unknown>, message: string): void;
    error(meta: Record<string, unknown>, message: string): void;
  };
}

export interface ApplyResult {
  created: number;
  updated: number;
  markedMissing: number;
  failed: number;
}

// One below the `summary` field's 320 maxLength, so the closing "." still fits.
const SUMMARY_CUT = 319;
const isHashtagLine = (text: string): boolean => text.split(/\s+/).every((t) => t.startsWith('#'));

/** First real paragraph of a description, whitespace collapsed, cut at a word boundary. */
export const firstParagraph = (text: string): string => {
  const paragraph =
    text
      .split(/\n\s*\n/)
      .map((p) => p.replace(/\s+/g, ' ').trim())
      .find((p) => p.length > 0 && !isHashtagLine(p)) ?? '';
  if (paragraph.length <= SUMMARY_CUT) return paragraph;
  const cut = paragraph.slice(0, SUMMARY_CUT);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : SUMMARY_CUT).replace(/[,;:\s]+$/, '')}.`;
};

const sourceData = (source: SourceSnapshot, fetchedAt: string): Record<string, unknown> => ({
  title: source.title,
  description: source.description,
  durationSeconds: source.durationSeconds,
  publishedAt: source.publishedAt,
  tags: source.tags.map((value) => ({ value })),
  privacyStatus: source.privacyStatus,
  embeddable: source.embeddable,
  hasMaxres: source.hasMaxres,
  thumbnailUrl: source.thumbnailUrl,
  contentHash: contentHash(source),
  fetchedAt,
});

export const applyPlan = async (
  payload: SyncPayload,
  plan: SyncPlan,
  // `autoPublish` is accepted so the env switch has one home, but a new video is never published
  // here: the publish gate needs a format, which nothing guesses.
  _options: { autoPublish: boolean },
  now: () => Date = () => new Date(),
): Promise<ApplyResult> => {
  const result: ApplyResult = { created: 0, updated: 0, markedMissing: 0, failed: 0 };
  const fetchedAt = now().toISOString();

  // One bad document must never abort the batch.
  const attempt = async (what: string, ref: Record<string, unknown>, run: () => Promise<unknown>): Promise<boolean> => {
    try {
      await run();
      return true;
    } catch (error) {
      result.failed += 1;
      payload.logger.error(
        { ...ref, error: error instanceof Error ? error.message : String(error) },
        `videos sync: ${what} failed`,
      );
      return false;
    }
  };

  for (const item of plan.creates) {
    const ok = await attempt('create', { externalId: item.externalId }, () =>
      payload.create({
        collection: 'videos',
        draft: true,
        overrideAccess: true,
        depth: 0,
        data: {
          provider: 'youtube',
          externalId: item.externalId,
          title: item.source.title,
          summary: firstParagraph(item.source.description),
          topics: item.suggestedTopicIds,
          syncState: 'needs-review',
          source: sourceData(item.source, fetchedAt),
          _status: 'draft',
        },
      }),
    );
    if (ok) result.created += 1;
  }

  for (const item of plan.updates) {
    const data: Record<string, unknown> = { source: sourceData(item.source, fetchedAt) };
    if (item.restoreFromMissing) data.syncState = 'synced';
    const ok = await attempt('update', { id: item.id }, () =>
      payload.update({ collection: 'videos', id: item.id, data, overrideAccess: true, depth: 0 }),
    );
    if (ok) result.updated += 1;
  }

  for (const id of plan.missing) {
    const ok = await attempt('mark missing', { id }, () =>
      payload.update({ collection: 'videos', id, data: { syncState: 'missing' }, overrideAccess: true, depth: 0 }),
    );
    if (ok) result.markedMissing += 1;
  }

  payload.logger.info({ ...result, unchanged: plan.unchanged, skipped: plan.skipped.length }, 'videos sync applied');
  return result;
};
