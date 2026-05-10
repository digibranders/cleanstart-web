import { describe, expect, it, vi } from 'vitest';

import { type PurgePayload, purgeLeadsPii } from './purge-leads-pii';

const fakeNow = new Date('2026-05-05T12:00:00Z');

interface LeadFixture {
  id: number;
  form?: { id: number; fields?: { name: string; type: string }[] } | null;
  fields?: Record<string, unknown> | null;
}

interface FormFixture {
  id: number;
  fields?: { name: string; type: string }[] | null;
}

const makePayload = (
  leadPages: LeadFixture[][],
  forms: FormFixture[] = [],
): PurgePayload => {
  let leadPageIdx = 0;
  return {
    logger: { info: vi.fn() },
    find: vi.fn(async (args) => {
      if (args.collection === 'forms') {
        return { docs: forms, hasNextPage: false };
      }
      const docs = leadPages[leadPageIdx] ?? [];
      leadPageIdx += 1;
      return { docs, hasNextPage: leadPageIdx < leadPages.length };
    }) as PurgePayload['find'],
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

  it('targets only leads older than retentionDays AND with piiRedactedAt = null', async () => {
    const payload = makePayload([[]]);
    await purgeLeadsPii(payload, { now: fakeNow, retentionDays: 365 });
    const findCalls = (payload.find as ReturnType<typeof vi.fn>).mock.calls;
    const leadsCall = findCalls.find((c) => (c[0] as { collection: string }).collection === 'leads')?.[0] as {
      where: {
        and: [
          { createdAt: { less_than: string } },
          { piiRedactedAt: { equals: null } },
        ];
      };
    };
    const cutoff = new Date(fakeNow.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
    expect(leadsCall.where.and[0]?.createdAt.less_than).toBe(cutoff);
    expect(leadsCall.where.and[1]?.piiRedactedAt.equals).toBeNull();
  });

  it('nulls ip + userAgent + email-typed fields and stamps piiRedactedAt', async () => {
    const payload = makePayload(
      [
        [
          {
            id: 7,
            form: { id: 1, fields: [{ name: 'workEmail', type: 'email' }] },
            fields: { workEmail: 'a@b.com', message: 'hi' },
          },
        ],
      ],
      [{ id: 1, fields: [{ name: 'workEmail', type: 'email' }] }],
    );
    const result = await purgeLeadsPii(payload, { now: fakeNow });
    expect(result).toEqual({ scanned: 1, redacted: 1, errors: 0 });
    const updateCall = (payload.update as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as {
      collection: string;
      id: number;
      data: Record<string, unknown>;
    };
    expect(updateCall.collection).toBe('leads');
    expect(updateCall.id).toBe(7);
    expect(updateCall.data.ip).toBeNull();
    expect(updateCall.data.userAgent).toBeNull();
    expect(updateCall.data.fields).toEqual({ workEmail: null, message: 'hi' });
    expect(updateCall.data.piiRedactedAt).toBe(fakeNow.toISOString());
  });

  it('also nulls phone-bearing fields by name even when typed text', async () => {
    const payload = makePayload(
      [
        [
          {
            id: 8,
            form: { id: 1, fields: [{ name: 'phoneNumber', type: 'text' }] },
            fields: { phoneNumber: '+1-555-1234', name: 'Alice' },
          },
        ],
      ],
      [{ id: 1, fields: [{ name: 'phoneNumber', type: 'text' }] }],
    );
    await purgeLeadsPii(payload, { now: fakeNow });
    const updateCall = (payload.update as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as {
      data: { fields?: Record<string, unknown> };
    };
    expect(updateCall.data.fields).toEqual({ phoneNumber: null, name: 'Alice' });
  });

  it('falls back to name-heuristic when the lead has no resolvable form', async () => {
    const payload = makePayload(
      [
        [
          {
            id: 9,
            form: null,
            fields: { email: 'a@b.com', message: 'hi' },
          },
        ],
      ],
      [],
    );
    await purgeLeadsPii(payload, { now: fakeNow });
    const updateCall = (payload.update as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as {
      data: { fields?: Record<string, unknown> };
    };
    expect(updateCall.data.fields).toEqual({ email: null, message: 'hi' });
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
