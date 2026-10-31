type DocId = number | string;

export type VideoFormat = 'explainer' | 'demo' | 'talk';

export interface CatalogTopicSeed {
  readonly slug: string;
  readonly name: string;
  readonly aliases: readonly string[];
}

export interface CatalogVideoSeed {
  readonly externalId: string;
  readonly slug: string;
  readonly title: string;
  readonly format: VideoFormat;
  readonly topics: readonly string[];
  readonly summary: string;
  readonly durationSeconds: number;
  readonly publishedAt: string;
  readonly thumb: 'maxres' | 'hq';
}

export interface ExistingTopic {
  readonly id: DocId;
  readonly slug: string;
  readonly name: string;
  readonly aliases: readonly string[];
}

export interface ExistingBackfillVideo {
  readonly id: DocId;
  readonly externalId: string;
  readonly slug: string | null;
  readonly title: string | null;
  readonly format: string | null;
  readonly topicSlugs: readonly string[];
  readonly summary: string | null;
  readonly status: 'draft' | 'published';
  readonly syncState: string | null;
}

export type UpdateReason = 'slug' | 'title' | 'format' | 'topics' | 'summary' | 'publish' | 'syncState';

export interface BackfillConflict {
  readonly externalId: string;
  readonly kind: 'slug-differs' | 'slug-taken';
  readonly wanted: string;
  /** The slug already on the document, or the externalId of the document holding the wanted slug. */
  readonly existing: string;
}

export interface BackfillPlan {
  readonly topics: {
    readonly create: CatalogTopicSeed[];
    readonly update: { id: DocId; topic: CatalogTopicSeed }[];
    readonly unchanged: number;
  };
  readonly videos: {
    readonly create: CatalogVideoSeed[];
    readonly update: { id: DocId; video: CatalogVideoSeed; reasons: UpdateReason[] }[];
    readonly unchanged: number;
    readonly conflicts: BackfillConflict[];
  };
}

const sameSet = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && [...a].sort().every((value, i) => value === [...b].sort()[i]);

/**
 * Decides what moving the code catalog into the CMS would change, without
 * touching anything. Pure, so a dry run and the real run share one decision and
 * a second run always plans nothing. A live slug is a URL commitment, so a
 * difference there is a conflict that blocks the run, never an update.
 */
export const planBackfill = ({
  catalogTopics,
  catalogVideos,
  existingTopics,
  existingVideos,
}: {
  catalogTopics: readonly CatalogTopicSeed[];
  catalogVideos: readonly CatalogVideoSeed[];
  existingTopics: readonly ExistingTopic[];
  existingVideos: readonly ExistingBackfillVideo[];
}): BackfillPlan => {
  const topicBySlug = new Map(existingTopics.map((t) => [t.slug, t]));
  const topicsCreate: CatalogTopicSeed[] = [];
  const topicsUpdate: BackfillPlan['topics']['update'] = [];
  let topicsUnchanged = 0;
  for (const seed of catalogTopics) {
    const current = topicBySlug.get(seed.slug);
    if (!current) topicsCreate.push(seed);
    else if (current.name !== seed.name || !sameSet(current.aliases, seed.aliases)) {
      topicsUpdate.push({ id: current.id, topic: seed });
    } else topicsUnchanged += 1;
  }

  const byExternalId = new Map(existingVideos.map((v) => [v.externalId, v]));
  const bySlug = new Map(existingVideos.filter((v) => v.slug).map((v) => [v.slug as string, v]));
  const videosCreate: CatalogVideoSeed[] = [];
  const videosUpdate: BackfillPlan['videos']['update'] = [];
  const conflicts: BackfillConflict[] = [];
  let videosUnchanged = 0;

  for (const seed of catalogVideos) {
    const current = byExternalId.get(seed.externalId);
    const holder = bySlug.get(seed.slug);
    if (holder && holder.externalId !== seed.externalId) {
      conflicts.push({ externalId: seed.externalId, kind: 'slug-taken', wanted: seed.slug, existing: holder.externalId });
      continue;
    }
    if (!current) {
      videosCreate.push(seed);
      continue;
    }
    // The sync gives every import an auto slug from its title, so a differing slug on an
    // untouched import (never published, still needs-review) is adopted, not a conflict.
    // Anything live or edited keeps its URL: that is a commitment, so it blocks the run.
    const slugIsAdoptable = !current.slug || (current.status === 'draft' && current.syncState === 'needs-review');
    if (current.slug && current.slug !== seed.slug && !slugIsAdoptable) {
      conflicts.push({ externalId: seed.externalId, kind: 'slug-differs', wanted: seed.slug, existing: current.slug });
      continue;
    }
    const reasons: UpdateReason[] = [];
    if (current.slug !== seed.slug) reasons.push('slug');
    if (current.title !== seed.title) reasons.push('title');
    if (current.format !== seed.format) reasons.push('format');
    if (!sameSet(current.topicSlugs, seed.topics)) reasons.push('topics');
    if ((current.summary ?? '') !== seed.summary) reasons.push('summary');
    if (current.status !== 'published') reasons.push('publish');
    if (current.syncState !== 'synced') reasons.push('syncState');
    if (reasons.length > 0) videosUpdate.push({ id: current.id, video: seed, reasons });
    else videosUnchanged += 1;
  }

  return {
    topics: { create: topicsCreate, update: topicsUpdate, unchanged: topicsUnchanged },
    videos: { create: videosCreate, update: videosUpdate, unchanged: videosUnchanged, conflicts },
  };
};
