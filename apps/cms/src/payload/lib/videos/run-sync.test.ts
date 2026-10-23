import { describe, expect, it, vi } from 'vitest';
import { runYoutubeSync } from './run-sync';
import { contentHash, toSource } from './plan-sync';
import type { YoutubeClient, YoutubeVideo } from './youtube-client';

const video = (id: string, over: Partial<YoutubeVideo> = {}): YoutubeVideo => ({
  id,
  title: `Title ${id}`,
  description: 'First paragraph.\n\n#SBOM',
  publishedAt: '2026-10-13T14:17:14Z',
  durationSeconds: 101,
  tags: [],
  privacyStatus: 'public',
  embeddable: true,
  liveBroadcastContent: 'none',
  hasMaxres: true,
  ...over,
});

const fakeClient = (videos: YoutubeVideo[], complete: boolean): YoutubeClient => ({
  listUploadIds: vi.fn(async () => ({ ids: videos.map((v) => v.id), complete })),
  getVideos: vi.fn(async () => videos),
});

const fakePayload = (existingDocs: Record<string, unknown>[]) => ({
  find: vi.fn(async ({ collection }: { collection: string; page?: number }) =>
    collection === 'videoTopics'
      ? { docs: [{ id: 1, name: 'SBOM', aliases: [{ value: 'software bill of materials' }] }], hasNextPage: false }
      : { docs: existingDocs, hasNextPage: false },
  ),
  create: vi.fn().mockResolvedValue({ id: 100 }),
  update: vi.fn().mockResolvedValue({ id: 1 }),
  logger: { info: vi.fn(), error: vi.fn() },
});

describe('runYoutubeSync', () => {
  it('lists the uploads before it asks for their details (the RSS client depends on it)', async () => {
    const client = fakeClient([video('AAAAAAAAAAA')], false);
    await runYoutubeSync({ payload: fakePayload([]), client, channelId: 'UCabc', autoPublish: false });
    const list = vi.mocked(client.listUploadIds).mock.invocationCallOrder[0] ?? 0;
    const get = vi.mocked(client.getVideos).mock.invocationCallOrder[0] ?? 0;
    expect(list).toBeGreaterThan(0);
    expect(list).toBeLessThan(get);
    expect(client.listUploadIds).toHaveBeenCalledWith('UCabc');
  });

  it('creates new videos with topics suggested from the loaded taxonomy', async () => {
    const payload = fakePayload([]);
    const result = await runYoutubeSync({
      payload,
      client: fakeClient([video('AAAAAAAAAAA')], true),
      channelId: 'UCabc',
      autoPublish: false,
    });
    expect(result).toMatchObject({ created: 1, updated: 0, markedMissing: 0, failed: 0 });
    expect((payload.create.mock.calls[0]?.[0] as { data: { topics: number[] } }).data.topics).toEqual([1]);
  });

  it('leaves an unchanged video alone and reads the stored duration and hash from the document', async () => {
    const v = video('AAAAAAAAAAA');
    const stored = {
      id: 9,
      externalId: 'AAAAAAAAAAA',
      syncState: 'synced',
      _status: 'published',
      source: { contentHash: contentHash(toSource(v)), durationSeconds: 101 },
    };
    const payload = fakePayload([stored]);
    const result = await runYoutubeSync({
      payload,
      client: fakeClient([v], true),
      channelId: 'UCabc',
      autoPublish: false,
    });
    expect(result).toMatchObject({ created: 0, updated: 0, unchanged: 1 });
    expect(payload.update).not.toHaveBeenCalled();
  });

  it('flags a vanished video as missing only when the listing was complete (API mode)', async () => {
    const stored = { id: 9, externalId: 'GONEGONEGON', syncState: 'synced', _status: 'published', source: {} };
    const api = await runYoutubeSync({
      payload: fakePayload([stored]),
      client: fakeClient([], true),
      channelId: 'UCabc',
      autoPublish: false,
    });
    expect(api.markedMissing).toBe(1);
    const rss = await runYoutubeSync({
      payload: fakePayload([stored]),
      client: fakeClient([], false),
      channelId: 'UCabc',
      autoPublish: false,
    });
    expect(rss.markedMissing).toBe(0);
  });

  it('reads every page of existing videos', async () => {
    const doc = (id: number, externalId: string) => ({ id, externalId, syncState: 'synced', _status: 'published', source: {} });
    const payload = fakePayload([]);
    payload.find.mockImplementation(async ({ collection, page }: { collection: string; page?: number }) => {
      if (collection === 'videoTopics') return { docs: [], hasNextPage: false };
      return page === 1
        ? { docs: [doc(1, 'AAAAAAAAAAA')], hasNextPage: true }
        : { docs: [doc(2, 'BBBBBBBBBBB')], hasNextPage: false };
    });
    const result = await runYoutubeSync({
      payload,
      client: fakeClient([], true),
      channelId: 'UCabc',
      autoPublish: false,
    });
    expect(result.markedMissing).toBe(2);
  });
});
