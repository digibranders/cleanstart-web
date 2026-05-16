import { describe, expect, it, vi } from 'vitest';

import { newsSitemapEndpoint, sitemapEndpoint } from './sitemap';

const sitemapHandler = sitemapEndpoint.handler;
const newsHandler = newsSitemapEndpoint.handler;
if (!sitemapHandler || !newsHandler) throw new Error('handlers undefined');

const baseSettings = {
  siteName: 'CleanStart',
  baseUrl: 'https://cleanstart.com',
  defaultLocale: 'en-US',
};

const makePayload = (
  byCollection: Record<string, { docs: unknown[]; hasNextPage?: boolean }> = {},
) => {
  const find = vi.fn(async ({ collection }: { collection: string }) =>
    byCollection[collection] ?? { docs: [] },
  );
  const findGlobal = vi.fn(async ({ slug }: { slug: string }) =>
    slug === 'siteSettings' ? baseSettings : {},
  );
  return { find, findGlobal };
};

describe('GET /api/sitemap.xml', () => {
  it('returns XML with the correct content-type and cache header', async () => {
    const payload = makePayload();
    const req = { payload } as unknown as Parameters<typeof sitemapHandler>[0];
    const res = await sitemapHandler(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/xml; charset=utf-8');
    expect(res.headers.get('cache-control')).toBe('public, max-age=3600');
    const body = await res.text();
    expect(body).toMatch(/^<\?xml /);
    expect(body).toContain('<urlset');
    // Site root entry always present.
    expect(body).toContain('<loc>https://cleanstart.com/</loc>');
  });

  it('includes detail + listing entries for a collection that has docs', async () => {
    const payload = makePayload({
      blogs: {
        docs: [
          {
            slug: 'first-post',
            updatedAt: '2026-05-05T12:00:00Z',
            _status: 'published',
          },
        ],
      },
    });
    const req = { payload } as unknown as Parameters<typeof sitemapHandler>[0];
    const body = await (await sitemapHandler(req)).text();
    expect(body).toContain('<loc>https://cleanstart.com/blog/first-post</loc>');
    expect(body).toContain('<loc>https://cleanstart.com/blogs</loc>');
    expect(body).toContain('<lastmod>2026-05-05T12:00:00Z</lastmod>');
  });
});

describe('GET /api/sitemap-news.xml', () => {
  it('renders the news urlset with the news namespace', async () => {
    const payload = makePayload({
      news: {
        docs: [
          {
            slug: 'launch',
            title: 'Launch',
            publicationDate: '2026-05-04T09:00:00Z',
            _status: 'published',
          },
        ],
      },
    });
    const req = { payload } as unknown as Parameters<typeof newsHandler>[0];
    const res = await newsHandler(req);
    const body = await res.text();
    expect(body).toContain('xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"');
    expect(body).toContain('<news:name>CleanStart</news:name>');
    expect(body).toContain('<news:language>en</news:language>');
    expect(body).toContain('<news:title>Launch</news:title>');
    expect(body).toContain('<loc>https://cleanstart.com/news/launch</loc>');
  });

  it('returns an empty urlset when no recent news exists', async () => {
    const payload = makePayload();
    const req = { payload } as unknown as Parameters<typeof newsHandler>[0];
    const body = await (await newsHandler(req)).text();
    expect(body).toContain('<urlset');
    expect(body).not.toContain('<news:news>');
  });
});
