import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { robotsEndpoint } from './robots';

const handler = robotsEndpoint.handler;
if (!handler) throw new Error('robots handler undefined');

const makePayload = (baseUrl = 'https://cleanstart.com') => {
  const findGlobal = vi.fn(async ({ slug }: { slug: string }) =>
    slug === 'siteSettings' ? { baseUrl } : {},
  );
  return { findGlobal };
};

const callHandler = async (payload: ReturnType<typeof makePayload>) => {
  const req = { payload } as unknown as Parameters<typeof handler>[0];
  return handler(req);
};

// vi.stubEnv handles the Node coercion issue (`process.env.X = undefined`
// stores the literal string "undefined") and unstubAllEnvs restores the
// original values cleanly between tests, so a developer running with
// PAYLOAD_PUBLIC_ENV already set in their shell still gets a clean slate.
describe('GET /api/robots.txt', () => {
  beforeEach(() => {
    vi.stubEnv('PAYLOAD_PUBLIC_ENV', '');
    vi.stubEnv('PAYLOAD_PUBLIC_ROBOTS_DISALLOW', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns text/plain with a short cache header', async () => {
    const res = await callHandler(makePayload());
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    expect(res.headers.get('cache-control')).toBe('public, max-age=300');
  });

  it('disallows everything by default (no PAYLOAD_PUBLIC_ENV set)', async () => {
    const body = await (await callHandler(makePayload())).text();
    expect(body).toBe('User-agent: *\nDisallow: /\n');
  });

  it('disallows everything on staging (PAYLOAD_PUBLIC_ENV != production)', async () => {
    vi.stubEnv('PAYLOAD_PUBLIC_ENV', 'staging');
    const body = await (await callHandler(makePayload())).text();
    expect(body).toBe('User-agent: *\nDisallow: /\n');
  });

  it('allows indexing and emits both sitemaps when PAYLOAD_PUBLIC_ENV=production', async () => {
    vi.stubEnv('PAYLOAD_PUBLIC_ENV', 'production');
    const body = await (await callHandler(makePayload())).text();
    expect(body).toContain('User-agent: *');
    expect(body).toContain('Allow: /');
    expect(body).toContain('Disallow: /admin/');
    expect(body).toContain('Disallow: /api/');
    expect(body).toContain('Sitemap: https://cleanstart.com/api/sitemap.xml');
    expect(body).toContain('Sitemap: https://cleanstart.com/api/sitemap-news.xml');
    expect(body).toContain('Sitemap: https://cleanstart.com/api/sitemap-image.xml');
  });

  it('strips trailing slashes from baseUrl when emitting sitemap URLs', async () => {
    vi.stubEnv('PAYLOAD_PUBLIC_ENV', 'production');
    const body = await (await callHandler(makePayload('https://cleanstart.com///'))).text();
    expect(body).toContain('Sitemap: https://cleanstart.com/api/sitemap.xml');
    expect(body).not.toContain('cleanstart.com//api');
  });

  it('PAYLOAD_PUBLIC_ROBOTS_DISALLOW=1 forces disallow even in production', async () => {
    vi.stubEnv('PAYLOAD_PUBLIC_ENV', 'production');
    vi.stubEnv('PAYLOAD_PUBLIC_ROBOTS_DISALLOW', '1');
    const body = await (await callHandler(makePayload())).text();
    expect(body).toBe('User-agent: *\nDisallow: /\n');
  });
});
