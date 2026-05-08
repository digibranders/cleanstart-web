import { describe, expect, it, vi } from 'vitest';

import { scanForBrokenLinks } from './scan';

const fakeResponse = (init: { status?: number } = {}): Response =>
  new Response(null, { status: init.status ?? 200 });

const seedRecord = (overrides: Partial<{ url: string; sourceCollection: string; sourceDocId: string; sourceDocSlug: string | null }> = {}) => ({
  url: 'https://example.com/a',
  sourceCollection: 'blogs',
  sourceDocId: '1',
  sourceDocSlug: 'a',
  ...overrides,
});

describe('scanForBrokenLinks (seed-record mode)', () => {
  it('classifies 200 as ok', async () => {
    const fetcher = vi.fn().mockResolvedValue(fakeResponse({ status: 200 }));
    const records = await scanForBrokenLinks({
      payload: { find: vi.fn() },
      fetcher: fetcher as unknown as typeof fetch,
      seedRecords: [seedRecord()],
    });
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ status: 'ok', httpStatus: 200 });
  });

  it('classifies 404 as broken', async () => {
    const fetcher = vi.fn().mockResolvedValue(fakeResponse({ status: 404 }));
    const records = await scanForBrokenLinks({
      payload: { find: vi.fn() },
      fetcher: fetcher as unknown as typeof fetch,
      seedRecords: [seedRecord()],
    });
    expect(records[0]).toMatchObject({ status: 'broken', httpStatus: 404 });
  });

  it('classifies 301 as redirect', async () => {
    const fetcher = vi.fn().mockResolvedValue(fakeResponse({ status: 301 }));
    const records = await scanForBrokenLinks({
      payload: { find: vi.fn() },
      fetcher: fetcher as unknown as typeof fetch,
      seedRecords: [seedRecord()],
    });
    expect(records[0]).toMatchObject({ status: 'redirect', httpStatus: 301 });
  });

  it('classifies network failure as network', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('boom'));
    const records = await scanForBrokenLinks({
      payload: { find: vi.fn() },
      fetcher: fetcher as unknown as typeof fetch,
      seedRecords: [seedRecord()],
    });
    expect(records[0]).toMatchObject({ status: 'network', httpStatus: 0 });
  });

  it('retries with GET when HEAD returns 405', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(fakeResponse({ status: 405 }))
      .mockResolvedValueOnce(fakeResponse({ status: 200 }));
    const records = await scanForBrokenLinks({
      payload: { find: vi.fn() },
      fetcher: fetcher as unknown as typeof fetch,
      seedRecords: [seedRecord()],
    });
    expect(records[0]).toMatchObject({ status: 'ok', httpStatus: 200 });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('only HEAD-checks each URL once even when many docs reference it', async () => {
    const fetcher = vi.fn().mockResolvedValue(fakeResponse({ status: 200 }));
    await scanForBrokenLinks({
      payload: { find: vi.fn() },
      fetcher: fetcher as unknown as typeof fetch,
      seedRecords: [
        seedRecord({ url: 'https://shared.example', sourceDocId: '1' }),
        seedRecord({ url: 'https://shared.example', sourceDocId: '2' }),
        seedRecord({ url: 'https://shared.example', sourceDocId: '3' }),
      ],
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
