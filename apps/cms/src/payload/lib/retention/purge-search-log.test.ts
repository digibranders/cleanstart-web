import { describe, expect, it, vi } from 'vitest';

import { type PurgePayload, purgeSearchLog } from './purge-search-log';

const fakeNow = new Date('2026-05-05T12:00:00Z');

const makePayload = (rows: { id: number }[][]): PurgePayload => {
  let pageIdx = 0;
  return {
    logger: { info: vi.fn() },
    find: vi.fn(async () => {
      const docs = rows[pageIdx] ?? [];
      pageIdx += 1;
      return { docs, hasNextPage: pageIdx < rows.length };
    }),
    delete: vi.fn(async () => undefined),
  };
};

describe('purgeSearchLog', () => {
  it('returns zero counts when nothing matches', async () => {
    const payload = makePayload([[]]);
    const result = await purgeSearchLog(payload, { now: fakeNow });
    expect(result).toEqual({ scanned: 0, deleted: 0, errors: 0 });
    expect(payload.delete).not.toHaveBeenCalled();
  });

  it('passes a less_than cutoff at retentionDays * 1d ago', async () => {
    const payload = makePayload([[]]);
    await purgeSearchLog(payload, { now: fakeNow, retentionDays: 30 });
    const args = (payload.find as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as {
      where: { createdAt: { less_than: string } };
    };
    const expected = new Date(fakeNow.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    expect(args.where.createdAt.less_than).toBe(expected);
  });

  it('deletes every row in the batch and counts them', async () => {
    const payload = makePayload([[{ id: 1 }, { id: 2 }, { id: 3 }]]);
    const result = await purgeSearchLog(payload, { now: fakeNow });
    expect(result).toEqual({ scanned: 3, deleted: 3, errors: 0 });
    expect(payload.delete).toHaveBeenCalledTimes(3);
  });

  it('counts a delete failure as an error and keeps going', async () => {
    const deleteFn = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('locked'))
      .mockResolvedValueOnce(undefined);
    const payload: PurgePayload = {
      ...makePayload([[{ id: 1 }, { id: 2 }, { id: 3 }]]),
      delete: deleteFn,
    };
    const result = await purgeSearchLog(payload, { now: fakeNow });
    expect(result).toEqual({ scanned: 3, deleted: 2, errors: 1 });
  });

  it('walks multiple pages until exhausted', async () => {
    const payload = makePayload([
      [{ id: 1 }, { id: 2 }],
      [{ id: 3 }],
    ]);
    const result = await purgeSearchLog(payload, { now: fakeNow });
    expect(result.scanned).toBe(3);
    expect(result.deleted).toBe(3);
  });

  it('logs the run summary', async () => {
    const payload = makePayload([[{ id: 1 }]]);
    await purgeSearchLog(payload, { now: fakeNow });
    expect(payload.logger?.info).toHaveBeenCalledWith(
      expect.objectContaining({ scanned: 1, deleted: 1, errors: 0 }),
      'searchLog retention purge complete',
    );
  });
});
