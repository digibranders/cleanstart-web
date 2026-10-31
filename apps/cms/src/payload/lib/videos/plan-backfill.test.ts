import { describe, expect, it } from 'vitest';

import {
  type CatalogTopicSeed,
  type CatalogVideoSeed,
  type ExistingBackfillVideo,
  type ExistingTopic,
  planBackfill,
} from './plan-backfill';

const topics: CatalogTopicSeed[] = [
  { slug: 'sbom', name: 'SBOM', aliases: ['sboms'] },
  { slug: 'vex', name: 'VEX', aliases: [] },
];

const seed = (over: Partial<CatalogVideoSeed> = {}): CatalogVideoSeed => ({
  externalId: 'AAAAAAAAAAA',
  slug: 'what-is-vex',
  title: 'What Is VEX?',
  format: 'explainer',
  topics: ['vex', 'sbom'],
  summary: 'A summary.',
  durationSeconds: 101,
  publishedAt: '2026-10-13T14:17:14+00:00',
  thumb: 'maxres',
  ...over,
});

const doc = (over: Partial<ExistingBackfillVideo> = {}): ExistingBackfillVideo => ({
  id: 7,
  externalId: 'AAAAAAAAAAA',
  slug: 'what-is-vex',
  title: 'What Is VEX?',
  format: 'explainer',
  topicSlugs: ['vex', 'sbom'],
  summary: 'A summary.',
  status: 'published',
  syncState: 'synced',
  ...over,
});

const existingTopics: ExistingTopic[] = [
  { id: 1, slug: 'sbom', name: 'SBOM', aliases: ['sboms'] },
  { id: 2, slug: 'vex', name: 'VEX', aliases: [] },
];

const run = (over: {
  videos?: CatalogVideoSeed[];
  existing?: ExistingBackfillVideo[];
  topics?: ExistingTopic[];
} = {}) =>
  planBackfill({
    catalogTopics: topics,
    catalogVideos: over.videos ?? [seed()],
    existingTopics: over.topics ?? existingTopics,
    existingVideos: over.existing ?? [],
  });

describe('planBackfill topics', () => {
  it('creates topics that do not exist yet', () => {
    expect(run({ topics: [] }).topics.create.map((t) => t.slug)).toEqual(['sbom', 'vex']);
  });
  it('updates a topic whose name or aliases differ, ignoring alias order', () => {
    const changed = [
      { id: 1, slug: 'sbom', name: 'SBOMs', aliases: ['sboms'] },
      { id: 2, slug: 'vex', name: 'VEX', aliases: [] },
    ];
    const plan = run({ topics: changed });
    expect(plan.topics.update).toEqual([{ id: 1, topic: topics[0] }]);
    expect(plan.topics.unchanged).toBe(1);
    const reordered = [{ id: 1, slug: 'sbom', name: 'SBOM', aliases: ['sboms'] }, { id: 2, slug: 'vex', name: 'VEX', aliases: [] }];
    expect(run({ topics: reordered }).topics.update).toEqual([]);
  });
});

describe('planBackfill videos', () => {
  it('creates a video that is not in the CMS', () => {
    expect(run().videos.create.map((v) => v.externalId)).toEqual(['AAAAAAAAAAA']);
  });

  it('leaves a fully matching, published, synced video alone', () => {
    const plan = run({ existing: [doc()] });
    expect(plan.videos).toMatchObject({ create: [], update: [], unchanged: 1, conflicts: [] });
  });

  it('updates and names every reason when the editorial layer differs', () => {
    const plan = run({
      existing: [doc({ title: 'Old', format: null, topicSlugs: ['vex'], summary: '', status: 'draft', syncState: 'needs-review' })],
    });
    expect(plan.videos.update).toHaveLength(1);
    expect(plan.videos.update[0]?.reasons.sort()).toEqual(['format', 'publish', 'summary', 'syncState', 'title', 'topics']);
  });

  it('treats topic order as irrelevant', () => {
    const plan = run({ existing: [doc({ topicSlugs: ['sbom', 'vex'] })] });
    expect(plan.videos.unchanged).toBe(1);
  });

  it('refuses to change a live slug (URLs are commitments)', () => {
    const plan = run({ existing: [doc({ slug: 'different-slug' })] });
    expect(plan.videos.conflicts).toEqual([
      { externalId: 'AAAAAAAAAAA', kind: 'slug-differs', wanted: 'what-is-vex', existing: 'different-slug' },
    ]);
    expect(plan.videos.update).toEqual([]);
  });

  it('refuses a slug already held by a different video', () => {
    const plan = run({ existing: [doc({ id: 9, externalId: 'ZZZZZZZZZZZ', slug: 'what-is-vex' })] });
    expect(plan.videos.conflicts).toEqual([
      { externalId: 'AAAAAAAAAAA', kind: 'slug-taken', wanted: 'what-is-vex', existing: 'ZZZZZZZZZZZ' },
    ]);
    expect(plan.videos.create).toEqual([]);
  });

  it('refuses to change the slug of a draft that was edited or published before', () => {
    const plan = run({ existing: [doc({ slug: 'edited-slug', status: 'draft', syncState: 'synced' })] });
    expect(plan.videos.conflicts).toHaveLength(1);
  });

  it('adopts the catalog slug on an untouched import that got an auto slug from its title', () => {
    const plan = run({
      existing: [doc({ slug: 'what-is-vex-how-it-tells-which-vulnerabilities-matter', status: 'draft', syncState: 'needs-review' })],
    });
    expect(plan.videos.conflicts).toEqual([]);
    expect(plan.videos.update[0]?.reasons).toContain('slug');
  });

  it('adopts the catalog slug when the synced draft has none yet', () => {
    const plan = run({ existing: [doc({ slug: null, status: 'draft', syncState: 'needs-review' })] });
    expect(plan.videos.conflicts).toEqual([]);
    expect(plan.videos.update[0]?.reasons).toContain('slug');
  });

  it('is idempotent: applying the plan and planning again changes nothing', () => {
    const first = run({ existing: [doc({ status: 'draft', syncState: 'needs-review', slug: null, title: 'T' })] });
    expect(first.videos.update).toHaveLength(1);
    expect(run({ existing: [doc()] }).videos.update).toEqual([]);
  });
});
