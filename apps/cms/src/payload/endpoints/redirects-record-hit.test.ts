import { afterEach, describe, expect, it, vi } from 'vitest';

import { redirectsRecordHitEndpoint } from './redirects-record-hit';

const handler = redirectsRecordHitEndpoint.handler as (req: unknown) => Promise<Response>;

const makeReq = (
  body: unknown,
  {
    docs = [],
    headers = new Headers(),
  }: { docs?: Array<{ id: string | number; hitCount?: number | null }>; headers?: Headers } = {},
) => {
  const find = vi.fn().mockResolvedValue({ docs });
  const update = vi.fn().mockResolvedValue({});
  const logger = { warn: vi.fn() };
  return {
    req: {
      json: async () => body,
      payload: { find, update, logger },
      headers,
    } as unknown as Parameters<typeof handler>[0],
    spies: { find, update },
  };
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('redirectsRecordHitEndpoint', () => {
  it('returns 400 when JSON parse fails', async () => {
    const req = {
      payload: {},
      headers: new Headers(),
      json: () => {
        throw new Error('bad json');
      },
    } as unknown as Parameters<typeof handler>[0];
    const res = await handler(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid_json');
  });

  it('returns 400 on Zod failure (missing from)', async () => {
    const { req } = makeReq({});
    const res = await handler(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid_body');
  });

  it('returns 404 when no redirect matches', async () => {
    const { req, spies } = makeReq({ from: '/nope' }, { docs: [] });
    const res = await handler(req);
    expect(res.status).toBe(404);
    expect(spies.update).not.toHaveBeenCalled();
  });

  it('increments hitCount and stamps lastHitAt on a match', async () => {
    const { req, spies } = makeReq({ from: '/jobs' }, { docs: [{ id: 7, hitCount: 4 }] });
    const res = await handler(req);
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
    expect(spies.update).toHaveBeenCalledTimes(1);
    const arg = spies.update.mock.calls[0]?.[0] as {
      collection: string;
      id: number;
      overrideAccess: boolean;
      data: { hitCount: number; lastHitAt: string };
    };
    expect(arg).toMatchObject({ collection: 'redirects', id: 7, overrideAccess: true });
    expect(arg.data.hitCount).toBe(5);
    expect(typeof arg.data.lastHitAt).toBe('string');
  });

  it('treats a null hitCount as zero', async () => {
    const { req, spies } = makeReq({ from: '/x' }, { docs: [{ id: 1, hitCount: null }] });
    await handler(req);
    const arg = spies.update.mock.calls[0]?.[0] as { data: { hitCount: number } };
    expect(arg.data.hitCount).toBe(1);
  });

  it('rejects when the shared secret is set but the header is missing', async () => {
    vi.stubEnv('REDIRECT_HIT_SECRET', 's3cret');
    const { req, spies } = makeReq({ from: '/jobs' }, { docs: [{ id: 7, hitCount: 0 }] });
    const res = await handler(req);
    expect(res.status).toBe(403);
    expect(spies.find).not.toHaveBeenCalled();
  });

  it('accepts when the shared secret matches the header', async () => {
    vi.stubEnv('REDIRECT_HIT_SECRET', 's3cret');
    const { req, spies } = makeReq(
      { from: '/jobs' },
      { docs: [{ id: 7, hitCount: 0 }], headers: new Headers({ 'x-redirect-hit-secret': 's3cret' }) },
    );
    const res = await handler(req);
    expect(res.status).toBe(200);
    expect(spies.update).toHaveBeenCalledTimes(1);
  });
});
