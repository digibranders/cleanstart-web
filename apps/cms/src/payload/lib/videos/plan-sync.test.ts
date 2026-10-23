import { describe, expect, it } from 'vitest';
import type { YoutubeVideo } from './youtube-client';
import {
  type ExistingVideo,
  contentHash,
  normaliseTag,
  planSync,
  suggestTopicIds,
  toSource,
  withKnownDuration,
} from './plan-sync';

const video = (over: Partial<YoutubeVideo> = {}): YoutubeVideo => ({
  id: 'AAAAAAAAAAA',
  title: 'T',
  description: 'First paragraph.\n\n#SBOM #VEX',
  publishedAt: '2026-10-13T14:17:14Z',
  durationSeconds: 101,
  tags: [],
  privacyStatus: 'public',
  embeddable: true,
  liveBroadcastContent: 'none',
  hasMaxres: true,
  ...over,
});

const existing = (over: Partial<ExistingVideo> = {}): ExistingVideo => ({
  id: 9,
  externalId: 'AAAAAAAAAAA',
  syncState: 'synced',
  contentHash: null,
  status: 'published',
  durationSeconds: 101,
  ...over,
});

const topics = [
  { id: 1, name: 'SBOM', aliases: ['software bill of materials'] },
  { id: 2, name: 'VEX', aliases: [] },
  { id: 3, name: 'Base images', aliases: [] },
];

describe('normaliseTag', () => {
  it('ignores case, hashes, hyphens and spacing', () => {
    expect(normaliseTag('#Base Images')).toBe('baseimages');
    expect(normaliseTag('base-images')).toBe('baseimages');
  });
});

describe('suggestTopicIds', () => {
  it('matches hashtags in the description and YouTube tags, once each', () => {
    const ids = suggestTopicIds(
      { tags: ['Software Bill of Materials'], description: 'x\n\n#VEX #ContainerSecurity #sbom' },
      topics,
    );
    expect(ids).toEqual([1, 2]);
  });

  it('suggests nothing when nothing matches', () => {
    expect(suggestTopicIds({ tags: ['kubernetes'], description: '#devops' }, topics)).toEqual([]);
  });

  it('only reads hashtags that start a word, not a "#" inside a URL fragment', () => {
    expect(suggestTopicIds({ tags: [], description: 'see https://x.test/page#vex' }, topics)).toEqual([]);
  });
});

describe('planSync', () => {
  const base = { existing: [], complete: true, topics };

  it('creates a draft candidate for a new public video, with suggested topics', () => {
    const plan = planSync({ ...base, fetched: [video()] });
    expect(plan.creates).toHaveLength(1);
    expect(plan.creates[0]).toMatchObject({ externalId: 'AAAAAAAAAAA', suggestedTopicIds: [1, 2] });
  });

  it.each([
    ['unlisted', video({ privacyStatus: 'unlisted' }), 'not-public'],
    ['private', video({ privacyStatus: 'private' }), 'not-public'],
    ['not embeddable', video({ embeddable: false }), 'not-embeddable'],
    ['upcoming', video({ liveBroadcastContent: 'upcoming' }), 'not-finished'],
    ['live', video({ liveBroadcastContent: 'live' }), 'not-finished'],
  ])('skips a %s video', (_label, v, reason) => {
    const plan = planSync({ ...base, fetched: [v] });
    expect(plan.creates).toEqual([]);
    expect(plan.skipped).toEqual([{ externalId: 'AAAAAAAAAAA', reason }]);
  });

  it('leaves an unchanged video alone', () => {
    const v = video();
    const plan = planSync({
      ...base,
      fetched: [v],
      existing: [existing({ contentHash: contentHash(toSource(v)) })],
    });
    expect(plan).toMatchObject({ creates: [], updates: [], unchanged: 1 });
  });

  it('updates only the source when YouTube content changed', () => {
    const v = video({ description: 'edited' });
    const plan = planSync({ ...base, fetched: [v], existing: [existing({ contentHash: 'old' })] });
    expect(plan.updates).toEqual([{ id: 9, source: toSource(v), restoreFromMissing: false }]);
  });

  it('flags a vanished video as missing, but only when the listing was complete', () => {
    const gone = existing({ externalId: 'GONEGONEGON', contentHash: 'h' });
    expect(planSync({ ...base, fetched: [], existing: [gone] }).missing).toEqual([9]);
    expect(planSync({ ...base, fetched: [], existing: [gone], complete: false }).missing).toEqual([]);
  });

  it('never touches manual documents', () => {
    const manual = existing({ id: 5, externalId: 'MANUALMANUA', syncState: 'manual', durationSeconds: null });
    const plan = planSync({ ...base, fetched: [video({ id: 'MANUALMANUA' })], existing: [manual] });
    expect(plan).toMatchObject({ creates: [], updates: [], missing: [], unchanged: 1 });
    expect(planSync({ ...base, fetched: [], existing: [manual] }).missing).toEqual([]);
  });

  it('brings a missing video back when it reappears', () => {
    const v = video();
    const plan = planSync({
      ...base,
      fetched: [v],
      existing: [existing({ syncState: 'missing', contentHash: contentHash(toSource(v)) })],
    });
    expect(plan.updates).toEqual([{ id: 9, source: toSource(v), restoreFromMissing: true }]);
  });

  it('does not treat an RSS run (no duration) as a change, and never erases a known duration', () => {
    const stored = toSource(video());
    const rssView = video({ durationSeconds: null });
    const plan = planSync({
      ...base,
      fetched: [rssView],
      existing: [existing({ contentHash: contentHash(stored) })],
    });
    expect(plan).toMatchObject({ updates: [], unchanged: 1 });
  });

  it('keeps the stored duration inside an update that changes something else', () => {
    const rssView = video({ durationSeconds: null, description: 'edited' });
    const plan = planSync({ ...base, fetched: [rssView], existing: [existing({ contentHash: 'old' })] });
    expect(plan.updates[0]?.source.durationSeconds).toBe(101);
  });
});

describe('withKnownDuration', () => {
  it('only fills in a missing duration', () => {
    const unknown = toSource(video({ durationSeconds: null }));
    expect(withKnownDuration(unknown, 55).durationSeconds).toBe(55);
    expect(withKnownDuration(unknown, null).durationSeconds).toBeNull();
    expect(withKnownDuration(toSource(video()), 55).durationSeconds).toBe(101);
  });
});

describe('contentHash', () => {
  it('is stable and sensitive to every snapshot field it covers', () => {
    const a = toSource(video());
    expect(contentHash(a)).toBe(contentHash(toSource(video())));
    expect(contentHash(a)).not.toBe(contentHash(toSource(video({ title: 'other' }))));
  });
});
