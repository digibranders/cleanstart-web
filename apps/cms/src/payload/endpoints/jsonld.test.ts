import { describe, expect, it, vi } from 'vitest';

import { jsonLdEndpoint } from './jsonld';

const handler = jsonLdEndpoint.handler;
if (!handler) throw new Error('handler undefined');

interface FakePayload {
  findByID: ReturnType<typeof vi.fn>;
  findGlobal: ReturnType<typeof vi.fn>;
}

const baseSiteSettings = {
  siteName: 'CleanStart',
  baseUrl: 'https://cleanstart.com',
  defaultLocale: 'en-US',
};

const baseSeoDefaults = {
  organizationJsonLd: { name: 'CleanStart, Inc.' },
};

const makePayload = (overrides: Partial<FakePayload> = {}): FakePayload => ({
  findByID: vi.fn().mockResolvedValue({
    id: 1,
    slug: 'example',
    title: 'Example',
    _status: 'published',
  }),
  findGlobal: vi.fn().mockImplementation(({ slug }: { slug: string }) =>
    slug === 'siteSettings'
      ? Promise.resolve(baseSiteSettings)
      : Promise.resolve(baseSeoDefaults),
  ),
  ...overrides,
});

const callEndpoint = async (
  url: string,
  payload: FakePayload = makePayload(),
): Promise<{ res: Response; payload: FakePayload }> => {
  const req = {
    url,
    payload,
    // The endpoint reads req.headers for IP-based rate limiting.
    headers: new Headers(),
  } as unknown as Parameters<typeof handler>[0];
  const res = await handler(req);
  return { res, payload };
};

describe('GET /api/jsonld/<collection>/<id>', () => {
  it('rejects an unsupported collection with 400', async () => {
    const { res } = await callEndpoint('http://x/api/jsonld/mystery/1');
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: 'unsupported_collection' });
  });

  it('rejects a non-numeric id with 400', async () => {
    const { res } = await callEndpoint('http://x/api/jsonld/blogs/abc');
    expect(res.status).toBe(400);
  });

  it('returns 404 when the doc is missing', async () => {
    const payload = makePayload({
      findByID: vi.fn().mockRejectedValue(new Error('not found')),
    });
    const { res } = await callEndpoint('http://x/api/jsonld/blogs/99', payload);
    expect(res.status).toBe(404);
  });

  it('returns 404 when the doc is in draft state', async () => {
    const payload = makePayload({
      findByID: vi.fn().mockResolvedValue({
        id: 1,
        slug: 'example',
        title: 'Example',
        _status: 'draft',
      }),
    });
    const { res } = await callEndpoint('http://x/api/jsonld/blogs/1', payload);
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toMatchObject({ error: 'not_published' });
  });

  it('returns the dispatched blob list with a 60s public cache header', async () => {
    const { res, payload } = await callEndpoint('http://x/api/jsonld/blogs/1');
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('public, max-age=60');
    expect(res.headers.get('content-type')).toBe('application/json');

    const body = (await res.json()) as { blobs: { '@type': string }[] };
    expect(body.blobs.map((b) => b['@type'])).toEqual([
      'Organization',
      'WebSite',
      'Article',
      'BreadcrumbList',
    ]);

    expect(payload.findByID).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'blogs',
        id: 1,
        depth: 2,
        draft: false,
      }),
    );
    expect(payload.findGlobal).toHaveBeenCalledWith({ slug: 'siteSettings' });
    expect(payload.findGlobal).toHaveBeenCalledWith({ slug: 'seoDefaults' });
  });

  it('handles authors (no Article in output, Person inlined)', async () => {
    const payload = makePayload({
      findByID: vi.fn().mockResolvedValue({
        id: 1,
        slug: 'jane-doe',
        name: 'Jane Doe',
        role: 'Researcher',
        _status: 'published',
      }),
    });
    const { res } = await callEndpoint('http://x/api/jsonld/authors/1', payload);
    const body = (await res.json()) as { blobs: { '@type': string }[] };
    expect(body.blobs.map((b) => b['@type'])).toEqual([
      'Organization',
      'WebSite',
      'Person',
      'BreadcrumbList',
    ]);
  });
});
