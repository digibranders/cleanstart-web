import { Forbidden, type PayloadRequest } from 'payload';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Media } from '../collections/Media';
import { followWithSsrfGuard } from '../lib/url-safety/follow-with-ssrf-guard';
import { mediaIngestUrlEndpoint } from './media-ingest-url';

vi.mock('../lib/url-safety/follow-with-ssrf-guard', () => ({
  followWithSsrfGuard: vi.fn(),
}));

const guard = vi.mocked(followWithSsrfGuard);

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const imageResponse = (headers: Record<string, string> = {}): Response =>
  new Response(PNG, { status: 200, headers: { 'content-type': 'image/png', ...headers } });

const makeReq = (user: unknown, create = vi.fn()): { req: PayloadRequest; create: typeof create } => {
  const req = {
    user,
    json: async () => ({ url: 'https://cdn.example.com/a/logo.png', alt: 'Logo' }),
    // The real Media rule, so these tests track it when author upload rights land (D-6).
    payload: { create, collections: { media: { config: { access: { create: Media.access?.create } } } } },
  } as unknown as PayloadRequest;
  return { req, create };
};

const run = (req: PayloadRequest): Promise<Response> =>
  Promise.resolve(mediaIngestUrlEndpoint.handler(req));

beforeEach(() => {
  guard.mockReset();
  guard.mockImplementation(async (url) => ({
    ok: true,
    response: imageResponse(),
    finalUrl: url,
    redirected: false,
  }));
});

describe('POST /api/media-ingest-url', () => {
  it('lets an editor ingest, creating the doc under Media access rules', async () => {
    const user = { id: 1, roles: ['editor'] };
    const { req, create } = makeReq(user, vi.fn().mockResolvedValue({ id: 7, url: '/m/logo.webp' }));

    const res = await run(req);

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, doc: { id: 7, url: '/m/logo.webp' } });
    expect(guard).toHaveBeenCalledOnce();
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'media', user, overrideAccess: false }),
    );
  });

  it('rejects an author with 403 before fetching or creating anything', async () => {
    const { req, create } = makeReq({ id: 2, roles: ['author'] });

    const res = await run(req);

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ ok: false, error: 'forbidden' });
    expect(guard).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects an anonymous request with 401', async () => {
    const { req, create } = makeReq(null);

    const res = await run(req);

    expect(res.status).toBe(401);
    expect(guard).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('maps a collection-level Forbidden from create to 403', async () => {
    const { req } = makeReq({ id: 1, roles: ['editor'] }, vi.fn().mockRejectedValue(new Forbidden()));

    const res = await run(req);

    expect(res.status).toBe(403);
  });

  it('stops at the SSRF guard before create', async () => {
    guard.mockResolvedValue({ ok: false, kind: 'unsafe-url', url: 'http://169.254.169.254/' });
    const { req, create } = makeReq({ id: 1, roles: ['admin'] });

    const res = await run(req);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: 'host_not_allowed' });
    expect(create).not.toHaveBeenCalled();
  });

  it('stops at the size limit before create', async () => {
    guard.mockImplementation(async (url) => ({
      ok: true,
      response: imageResponse({ 'content-length': String(26 * 1024 * 1024) }),
      finalUrl: url,
      redirected: false,
    }));
    const { req, create } = makeReq({ id: 1, roles: ['editor'] });

    const res = await run(req);

    expect(res.status).toBe(413);
    expect(create).not.toHaveBeenCalled();
  });
});
