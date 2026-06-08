import { createHmac } from 'node:crypto';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const submitLead = vi.fn();
vi.mock('../lib/lead-handlers', () => ({ submitLead: (...a: unknown[]) => submitLead(...a) }));

import { calcomInboundEndpoint } from './integrations-inbound';

const SECRET = 'cal-test-secret';

const sign = (body: string): string =>
  createHmac('sha256', SECRET).update(body).digest('hex');

const makeReq = ({
  body,
  signature,
  rows = [{ id: 'int-1', calcomConfig: { fallbackFormId: 5 } }],
  ip = '203.0.113.1',
}: {
  body: string;
  signature?: string | null;
  rows?: unknown[];
  ip?: string;
}) =>
  ({
    headers: new Headers({
      'x-forwarded-for': ip,
      ...(signature ? { 'x-cal-signature-256': signature } : {}),
    }),
    text: async () => body,
    payload: {
      find: vi.fn().mockResolvedValue({ docs: rows }),
      findByID: vi.fn().mockResolvedValue({ schemaVersion: 3 }),
      logger: { warn: vi.fn() },
    },
  }) as never;

const run = (req: never): Promise<Response> =>
  (calcomInboundEndpoint.handler as (r: never) => Promise<Response>)(req);

const bookingBody = JSON.stringify({
  triggerEvent: 'BOOKING_CREATED',
  payload: {
    title: 'Intro call',
    startTime: '2026-07-01T10:00:00Z',
    attendees: [{ name: 'Dana', email: 'dana@example.com' }],
  },
});

describe('calcomInboundEndpoint', () => {
  beforeEach(() => {
    process.env.CALCOM_SIGNING_SECRET = SECRET;
    submitLead.mockReset();
    submitLead.mockResolvedValue({ ok: true, leadId: 'lead-1' });
  });

  afterEach(() => {
    process.env.CALCOM_SIGNING_SECRET = '';
  });

  it('rejects an empty body with 400', async () => {
    const res = await run(makeReq({ body: '', signature: sign('') }));
    expect(res.status).toBe(400);
  });

  it('returns 503 when no active cal.com row exists', async () => {
    const res = await run(makeReq({ body: bookingBody, signature: sign(bookingBody), rows: [] }));
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ error: 'no_active_calcom_row' });
  });

  it('returns 503 when the signing secret is not configured', async () => {
    process.env.CALCOM_SIGNING_SECRET = '';
    const res = await run(makeReq({ body: bookingBody, signature: sign(bookingBody) }));
    expect(res.status).toBe(503);
  });

  it('rejects a missing signature with 401', async () => {
    const res = await run(makeReq({ body: bookingBody, signature: null }));
    expect(res.status).toBe(401);
    expect(submitLead).not.toHaveBeenCalled();
  });

  it('rejects a tampered signature with 401', async () => {
    const res = await run(makeReq({ body: bookingBody, signature: sign('different payload') }));
    expect(res.status).toBe(401);
    expect(submitLead).not.toHaveBeenCalled();
  });

  it('ignores non-BOOKING_CREATED events even with a valid signature', async () => {
    const body = JSON.stringify({ triggerEvent: 'BOOKING_CANCELLED' });
    const res = await run(makeReq({ body, signature: sign(body) }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, ignored: 'BOOKING_CANCELLED' });
    expect(submitLead).not.toHaveBeenCalled();
  });

  it('submits a lead for a valid signed BOOKING_CREATED event', async () => {
    const res = await run(makeReq({ body: bookingBody, signature: sign(bookingBody) }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, leadId: 'lead-1' });
    expect(submitLead).toHaveBeenCalledTimes(1);
    const submission = submitLead.mock.calls[0]?.[1];
    expect(submission).toMatchObject({
      formId: 5,
      formSchemaVersion: 3,
      source: 'calcom',
      fields: expect.objectContaining({ email: 'dana@example.com', name: 'Dana' }),
    });
  });

  it('rejects invalid JSON (with a valid signature) as 400', async () => {
    const body = '{not-json';
    const res = await run(makeReq({ body, signature: sign(body) }));
    expect(res.status).toBe(400);
  });

  it('returns 503 when the booking has no fallback form configured', async () => {
    const res = await run(
      makeReq({
        body: bookingBody,
        signature: sign(bookingBody),
        rows: [{ id: 'int-1', calcomConfig: { fallbackFormId: null } }],
      }),
    );
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ error: 'no_fallback_form_configured' });
  });
});
