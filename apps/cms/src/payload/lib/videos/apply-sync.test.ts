import { describe, expect, it, vi } from 'vitest';
import { applyPlan, firstParagraph } from './apply-sync';
import { type SyncPlan, toSource } from './plan-sync';

const source = toSource({
  id: 'AAAAAAAAAAA',
  title: 'T',
  description: 'First paragraph.\n\nmore',
  publishedAt: '2026-10-13T14:17:14Z',
  durationSeconds: 101,
  tags: ['sbom'],
  privacyStatus: 'public',
  embeddable: true,
  liveBroadcastContent: 'none',
  hasMaxres: true,
});
const emptyPlan: SyncPlan = { creates: [], updates: [], unchanged: 0, missing: [], skipped: [] };
const now = (): Date => new Date('2026-10-23T12:00:00Z');

const fakePayload = () => ({
  create: vi.fn().mockResolvedValue({ id: 1 }),
  update: vi.fn().mockResolvedValue({ id: 1 }),
  logger: { info: vi.fn(), error: vi.fn() },
});

const callData = (mock: ReturnType<typeof vi.fn>, n = 0): Record<string, unknown> =>
  (mock.mock.calls[n]?.[0] as { data: Record<string, unknown> }).data;

describe('firstParagraph', () => {
  it('takes the first real paragraph, collapsing whitespace', () => {
    expect(firstParagraph('Hello   there\nfriend.\n\nMore')).toBe('Hello there friend.');
  });

  it('skips a leading hashtag-only paragraph', () => {
    expect(firstParagraph('#SBOM #VEX\n\nThe real text.')).toBe('The real text.');
  });

  it('never exceeds the 320 character summary limit', () => {
    const out = firstParagraph('word '.repeat(200));
    expect(out.length).toBeLessThanOrEqual(320);
    expect(out.endsWith('word.')).toBe(true);
  });
});

describe('applyPlan', () => {
  it('creates a needs-review draft with title, summary, topics and the source snapshot', async () => {
    const payload = fakePayload();
    const plan = { ...emptyPlan, creates: [{ externalId: 'AAAAAAAAAAA', source, suggestedTopicIds: [1, 2] }] };
    const result = await applyPlan(payload, plan, { autoPublish: false }, now);
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'videos', draft: true, overrideAccess: true, depth: 0 }),
    );
    expect(callData(payload.create)).toMatchObject({
      provider: 'youtube',
      externalId: 'AAAAAAAAAAA',
      title: 'T',
      summary: 'First paragraph.',
      topics: [1, 2],
      syncState: 'needs-review',
      _status: 'draft',
      source: {
        title: 'T',
        durationSeconds: 101,
        tags: [{ value: 'sbom' }],
        fetchedAt: '2026-10-23T12:00:00.000Z',
      },
    });
    expect(result.created).toBe(1);
  });

  it('writes only the source group when updating', async () => {
    const payload = fakePayload();
    await applyPlan(payload, { ...emptyPlan, updates: [{ id: 9, source, restoreFromMissing: false }] }, { autoPublish: false }, now);
    expect(Object.keys(callData(payload.update))).toEqual(['source']);
  });

  it('restores syncState when a missing video returns', async () => {
    const payload = fakePayload();
    await applyPlan(payload, { ...emptyPlan, updates: [{ id: 9, source, restoreFromMissing: true }] }, { autoPublish: false }, now);
    expect(callData(payload.update).syncState).toBe('synced');
  });

  it('marks vanished videos missing without unpublishing them', async () => {
    const payload = fakePayload();
    await applyPlan(payload, { ...emptyPlan, missing: [4] }, { autoPublish: false }, now);
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({ id: 4, data: { syncState: 'missing' } }));
  });

  it('keeps going when one item fails and reports it without leaking details beyond the message', async () => {
    const payload = fakePayload();
    payload.create.mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce({ id: 2 });
    const plan = {
      ...emptyPlan,
      creates: [
        { externalId: 'AAAAAAAAAAA', source, suggestedTopicIds: [] },
        { externalId: 'BBBBBBBBBBB', source, suggestedTopicIds: [] },
      ],
    };
    const result = await applyPlan(payload, plan, { autoPublish: false }, now);
    expect(result).toMatchObject({ created: 1, failed: 1 });
    expect(payload.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ externalId: 'AAAAAAAAAAA', error: 'boom' }),
      expect.any(String),
    );
  });

  it('never publishes on import, even with autoPublish on: no format can be guessed', async () => {
    const payload = fakePayload();
    const plan = { ...emptyPlan, creates: [{ externalId: 'AAAAAAAAAAA', source, suggestedTopicIds: [1] }] };
    await applyPlan(payload, plan, { autoPublish: true }, now);
    expect(callData(payload.create)._status).toBe('draft');
  });
});
