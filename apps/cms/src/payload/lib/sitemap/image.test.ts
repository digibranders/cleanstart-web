import { describe, expect, it, vi } from 'vitest';

import type { SitemapPayload } from './collect';
import { collectImageSitemapEntries } from './image';
import { renderImageUrlsetXml } from './xml';

const makePayload = (
  byCollection: Record<string, { docs: unknown[]; hasNextPage?: boolean }>,
): SitemapPayload => ({
  find: vi.fn(async ({ collection }) =>
    byCollection[collection] ?? { docs: [] },
  ) as unknown as SitemapPayload['find'],
});

describe('collectImageSitemapEntries', () => {
  it('emits a url with one image:image per indexable, hero-carrying doc', async () => {
    const payload = makePayload({
      blogs: {
        docs: [
          {
            slug: 'first',
            title: 'First post',
            _status: 'published',
            heroImage: {
              url: 'https://cdn.example.com/hero/first.webp',
              alt: 'A computer screen showing code',
            },
          },
        ],
      },
    });
    const entries = await collectImageSitemapEntries(payload, 'https://cleanstart.com');
    expect(entries).toEqual([
      {
        loc: 'https://cleanstart.com/blog/first',
        images: [
          {
            loc: 'https://cdn.example.com/hero/first.webp',
            caption: 'A computer screen showing code',
            title: 'First post',
          },
        ],
      },
    ]);
  });

  it('skips drafts and noindex docs', async () => {
    const payload = makePayload({
      blogs: {
        docs: [
          { slug: 'draft', title: 'D', _status: 'draft', heroImage: { url: 'https://cdn/x.webp' } },
          {
            slug: 'noindex',
            title: 'N',
            _status: 'published',
            seo: { indexable: 'noindex' },
            heroImage: { url: 'https://cdn/y.webp' },
          },
          {
            slug: 'ok',
            title: 'O',
            _status: 'published',
            heroImage: { url: 'https://cdn/z.webp' },
          },
        ],
      },
    });
    const entries = await collectImageSitemapEntries(payload, 'https://cleanstart.com');
    expect(entries).toHaveLength(1);
    expect(entries[0]?.loc).toBe('https://cleanstart.com/blog/ok');
  });

  it('skips docs without a resolved image (number ID or null)', async () => {
    const payload = makePayload({
      blogs: {
        docs: [
          { slug: 'unresolved', title: 'U', _status: 'published', heroImage: 42 },
          { slug: 'null', title: 'N', _status: 'published', heroImage: null },
        ],
      },
    });
    const entries = await collectImageSitemapEntries(payload, 'https://cleanstart.com');
    expect(entries).toEqual([]);
  });

  it('uses authors.photo as the image source for the authors collection', async () => {
    const payload = makePayload({
      authors: {
        docs: [
          {
            slug: 'jane-doe',
            name: 'Jane Doe',
            _status: 'published',
            photo: { url: 'https://cdn/authors/jane.webp', alt: 'Headshot of Jane Doe' },
          },
        ],
      },
    });
    const entries = await collectImageSitemapEntries(payload, 'https://cleanstart.com');
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      loc: 'https://cleanstart.com/author/jane-doe',
      images: [
        expect.objectContaining({
          loc: 'https://cdn/authors/jane.webp',
          title: 'Jane Doe',
        }),
      ],
    });
  });

  it('glues path-only image URLs onto the baseUrl', async () => {
    const payload = makePayload({
      blogs: {
        docs: [
          {
            slug: 'local',
            title: 'L',
            _status: 'published',
            heroImage: { url: '/media/hero.webp', alt: '' },
          },
        ],
      },
    });
    const entries = await collectImageSitemapEntries(payload, 'https://cleanstart.com');
    expect(entries[0]?.images[0]?.loc).toBe('https://cleanstart.com/media/hero.webp');
  });
});

describe('renderImageUrlsetXml', () => {
  it('emits the image-spec namespace and well-formed image:image children', () => {
    const xml = renderImageUrlsetXml([
      {
        loc: 'https://cleanstart.com/blog/post',
        images: [
          {
            loc: 'https://cdn/hero.webp',
            caption: 'Cap & friends',
            title: 'A <post> title',
          },
        ],
      },
    ]);
    expect(xml).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
    expect(xml).toContain('<image:loc>https://cdn/hero.webp</image:loc>');
    // caption has an ampersand → must be escaped
    expect(xml).toContain('<image:caption>Cap &amp; friends</image:caption>');
    // title contains markup chars → escaped
    expect(xml).toContain('<image:title>A &lt;post&gt; title</image:title>');
  });

  it('omits caption / title elements when their values are empty', () => {
    const xml = renderImageUrlsetXml([
      {
        loc: 'https://cleanstart.com/x',
        images: [{ loc: 'https://cdn/x.webp', caption: '', title: null }],
      },
    ]);
    expect(xml).not.toContain('<image:caption>');
    expect(xml).not.toContain('<image:title>');
    expect(xml).toContain('<image:loc>https://cdn/x.webp</image:loc>');
  });
});
