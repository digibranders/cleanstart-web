import { describe, expect, it, vi } from 'vitest';

import { type PurgePayload, purgeLeadsPii } from './purge-leads-pii';

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
    update: vi.fn(async () => undefined),
  };
};

describe('purgeLeadsPii', () => {
  it('returns zero counts when nothing matches', async () => {
    const payload = makePayload([[]]);
    const result = await purgeLeadsPii(payload, { now: fakeNow });
    expect(result).toEqual({ scanned: 0, redacted: 0, errors: 0 });
    expect(payload.update).not.toHaveBeenCalled();
  });

  it('targets only leads older than retentionDays AND with non-null ip or userAgent', async () => {
    const payload = makePayload([[]]);
    await purgeLeadsPii(payload, { now: fakeNow, retentionDays: 365 });
    const args = (payload.find as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as {
      where: {
        and: [
          { createdAt: { less_than: string } },
          { or: [{ ip: { not_equals: null } }, { userAgent: { not_equals: null } }] },
        ];
      };
    };
    const cutoff = new Date(fakeNow.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
    expect(args.where.and[0]?.createdAt.less_than).toBe(cutoff);
    expect(args.where.and[1]?.or).toEqual([
      { ip: { not_equals: null } },
      { userAgent: { not_equals: null } },
    ]);
  });

  it('updates each row with { ip: null, userAgent: null }', async () => {
    const payload = makePayload([[{ id: 7 }, { id: 8 }]]);
    const result = await purgeLeadsPii(payload, { now: fakeNow });
    expect(result).toEqual({ scanned: 2, redacted: 2, errors: 0 });
    expect(payload.update).toHaveBeenCalledTimes(2);
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'leads',
        id: 7,
        data: { ip: null, userAgent: null },
        overrideAccess: true,
      }),
    );
  });

  it('counts an update failure as an error and keeps going', async () => {
    const update = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('locked'))
      .mockResolvedValueOnce(undefined);
    const payload: PurgePayload = {
      ...makePayload([[{ id: 1 }, { id: 2 }, { id: 3 }]]),
      update,
    };
    const result = await purgeLeadsPii(payload, { now: fakeNow });
    expect(result).toEqual({ scanned: 3, redacted: 2, errors: 1 });
  });

  it('logs the run summary', async () => {
    const payload = makePayload([[{ id: 1 }]]);
    await purgeLeadsPii(payload, { now: fakeNow });
    expect(payload.logger?.info).toHaveBeenCalledWith(
      expect.objectContaining({ scanned: 1, redacted: 1, errors: 0 }),
      'leads PII redaction complete',
    );
  });
});
