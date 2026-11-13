import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  env: { HUBSPOT_WEBHOOK_SECRET: undefined as string | undefined, APP_URL: 'https://partners.cleanstart.com' },
  triggerPoll: vi.fn(),
  captureException: vi.fn(),
}));
vi.mock('@/env', () => ({ env: mocks.env }));
vi.mock('@/server/jobs/hubspot-poll', () => ({ triggerPoll: mocks.triggerPoll }));
vi.mock('@sentry/nextjs', () => ({ captureException: mocks.captureException }));

import { POST } from './route';

const SECRET = 's3cret';
const BODY = '[{"objectId":1,"propertyName":"dealstage"}]';
const URI = 'https://partners.cleanstart.com/api/hubspot/webhook';

const signed = (body: string, timestamp = String(Date.now()), secret = SECRET): Request =>
  new Request(URI, {
    method: 'POST',
    body,
    headers: {
      'x-hubspot-request-timestamp': timestamp,
      'x-hubspot-signature-v3': createHmac('sha256', secret).update(`POST${URI}${body}${timestamp}`).digest('base64'),
    },
  });

beforeEach(() => {
  mocks.env.HUBSPOT_WEBHOOK_SECRET = SECRET;
  mocks.triggerPoll.mockReset().mockResolvedValue(true);
  mocks.captureException.mockReset();
});

describe('POST /api/hubspot/webhook', () => {
  it('answers 503 and does not poll while the secret is not configured', async () => {
    mocks.env.HUBSPOT_WEBHOOK_SECRET = undefined;
    const res = await POST(signed(BODY));
    expect(res.status).toBe(503);
    expect(mocks.triggerPoll).not.toHaveBeenCalled();
  });

  it('answers 401 and does not poll for a bad signature', async () => {
    const res = await POST(signed(BODY, String(Date.now()), 'wrong-secret'));
    expect(res.status).toBe(401);
    expect(mocks.triggerPoll).not.toHaveBeenCalled();
  });

  it('answers 401 when the signature headers are missing', async () => {
    const res = await POST(new Request(URI, { method: 'POST', body: BODY }));
    expect(res.status).toBe(401);
    expect(mocks.triggerPoll).not.toHaveBeenCalled();
  });

  it('answers 413 for a body above 1 MB before checking the signature, and does not poll', async () => {
    const res = await POST(signed('x'.repeat(1_048_577)));
    expect(res.status).toBe(413);
    expect(mocks.triggerPoll).not.toHaveBeenCalled();
  });

  it('answers 413 from the content-length header without reading the body', async () => {
    const req = new Request(URI, { method: 'POST', body: BODY, headers: { 'content-length': '2000000' } });
    const text = vi.spyOn(req, 'text');
    expect((await POST(req)).status).toBe(413);
    expect(text).not.toHaveBeenCalled();
  });

  it('answers 200 and polls once for a valid signature', async () => {
    const res = await POST(signed(BODY));
    expect(res.status).toBe(200);
    expect(mocks.triggerPoll).toHaveBeenCalledTimes(1);
  });

  it('still answers 200 and reports a failed background poll to Sentry', async () => {
    const failure = new Error('hubspot down');
    mocks.triggerPoll.mockRejectedValue(failure);
    const res = await POST(signed(BODY));
    expect(res.status).toBe(200);
    await vi.waitFor(() => expect(mocks.captureException).toHaveBeenCalledWith(failure, { tags: { job: 'hubspot-poll', trigger: 'webhook' } }));
  });
});
