import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  __clearSyncCachesForTests,
  __setSearchClientForTests,
} from '../lib/search/sync';
import type { SearchClient } from '../lib/search/client';
import {
  searchSyncAfterChangeHook,
  searchSyncAfterDeleteHook,
} from './search-sync';

const okResult = { ok: true as const, skipped: false as const, status: 202 };

const makeClient = (): SearchClient => ({
  enabled: true,
  upsertDocuments: vi.fn(async () => okResult),
  deleteDocument: vi.fn(async () => okResult),
  updateSettings: vi.fn(async () => okResult),
  getStats: vi.fn(async () => null),
  search: vi.fn(async () => null),
});

const makeReq = () =>
  ({
    payload: {
      logger: { warn: vi.fn() },
      findGlobal: vi.fn(async () => ({ baseUrl: 'https://cleanstart.com' })),
    },
  }) as unknown as Parameters<ReturnType<typeof searchSyncAfterChangeHook>>[0]['req'];

afterEach(() => {
  __setSearchClientForTests(null);
  __clearSyncCachesForTests();
});

describe('searchSyncAfterChangeHook', () => {
  it('returns the doc unchanged and fires an upsert', async () => {
    const client = makeClient();
    __setSearchClientForTests(client);
    const hook = searchSyncAfterChangeHook('blogs');
    const doc = { id: 1, slug: 'x', title: 'X', _status: 'published' } as Record<string, unknown>;
    const ret = await hook({
      doc,
      req: makeReq(),
      // afterChange hooks accept many fields; we only need doc + req here.
    } as unknown as Parameters<ReturnType<typeof searchSyncAfterChangeHook>>[0]);
    expect(ret).toBe(doc);
    expect(client.upsertDocuments).toHaveBeenCalled();
  });

  it('swallows thrown errors so a save never fails on search outage', async () => {
    const client: SearchClient = {
      ...makeClient(),
      upsertDocuments: vi.fn(async () => {
        throw new Error('search down');
      }),
    };
    __setSearchClientForTests(client);
    const hook = searchSyncAfterChangeHook('blogs');
    const req = makeReq();
    const doc = { id: 1, slug: 'x', title: 'X', _status: 'published' } as Record<string, unknown>;
    const ret = await hook({
      doc,
      req,
    } as unknown as Parameters<ReturnType<typeof searchSyncAfterChangeHook>>[0]);
    expect(ret).toBe(doc);
    expect(
      (req.payload as unknown as { logger: { warn: ReturnType<typeof vi.fn> } }).logger.warn,
    ).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'blogs' }),
      'search.afterChange threw',
    );
  });
});

describe('searchSyncAfterDeleteHook', () => {
  it('fires a delete with the doc id', async () => {
    const client = makeClient();
    __setSearchClientForTests(client);
    const hook = searchSyncAfterDeleteHook('blogs');
    await hook({
      id: 99,
      req: makeReq(),
    } as unknown as Parameters<ReturnType<typeof searchSyncAfterDeleteHook>>[0]);
    expect(client.deleteDocument).toHaveBeenCalledWith('content', 'blogs:99');
  });

  it('swallows thrown errors', async () => {
    const client: SearchClient = {
      ...makeClient(),
      deleteDocument: vi.fn(async () => {
        throw new Error('search down');
      }),
    };
    __setSearchClientForTests(client);
    const hook = searchSyncAfterDeleteHook('blogs');
    const req = makeReq();
    await hook({
      id: 1,
      req,
    } as unknown as Parameters<ReturnType<typeof searchSyncAfterDeleteHook>>[0]);
    expect(
      (req.payload as unknown as { logger: { warn: ReturnType<typeof vi.fn> } }).logger.warn,
    ).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'blogs', id: 1 }),
      'search.afterDelete threw',
    );
  });
});
