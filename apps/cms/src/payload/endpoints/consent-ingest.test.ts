import { beforeEach, describe, expect, it, vi } from 'vitest';

import { handleConsentIngest } from './consent-ingest';

const makeReq = ({
  headers = {},
  body,
}: {
  headers?: Record<string, string>;
  body?: unknown;
}) => ({
  headers: new Headers(headers),
  json: async () => body,
  payload: { create: vi.fn().mockResolvedValue({ id: 'row1' }) },
});

describe('handleConsentIngest', () => {
  beforeEach(() => {
    process.env.CONSENT_INGEST_SECRET = 'test-secret';
  });

  it('rejects requests without the shared secret', async () => {
    const req = makeReq({ headers: {}, body: {} });
    const res = await handleConsentIngest(req as never);
    expect(res.status).toBe(401);
  });

  it('rejects malformed bodies with 400', async () => {
    const req = makeReq({
      headers: { authorization: 'Bearer test-secret' },
      body: { decision: 'nope' },
    });
    const res = await handleConsentIngest(req as never);
    expect(res.status).toBe(400);
  });

  it('creates a consentLog row for a valid request', async () => {
    const req = makeReq({
      headers: { authorization: 'Bearer test-secret' },
      body: {
        anonymousId: 'abc',
        decision: 'accept_all',
        categories: { essential: true, analytics: true },
        consentVersion: 1,
        gpc: false,
        country: 'DE',
        ipHash: 'h1',
        userAgentHash: 'h2',
      },
    });
    const res = await handleConsentIngest(req as never);
    expect(res.status).toBe(204);
    expect(req.payload.create).toHaveBeenCalledWith({
      collection: 'consentLog',
      data: expect.objectContaining({ anonymousId: 'abc', decision: 'accept_all' }),
      overrideAccess: true,
    });
  });
});
