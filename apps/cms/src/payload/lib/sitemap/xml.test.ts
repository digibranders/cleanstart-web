import { describe, expect, it } from 'vitest';

import {
  renderNewsUrlsetXml,
  renderUrlsetXml,
  xmlEscape,
} from './xml';

describe('xmlEscape', () => {
  it('escapes the XML special characters', () => {
    expect(xmlEscape('a & b < c > d "e" \'f\'')).toBe(
      'a &amp; b &lt; c &gt; d &quot;e&quot; &apos;f&apos;',
    );
  });

  it('leaves non-special characters alone', () => {
    expect(xmlEscape('plain text 123 / : -')).toBe('plain text 123 / : -');
  });
});

describe('renderUrlsetXml', () => {
  it('renders the XML prolog and namespaces', () => {
    const xml = renderUrlsetXml([{ loc: 'https://cleanstart.com/blogs/x' }]);
    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('<loc>https://cleanstart.com/blogs/x</loc>');
    expect(xml.endsWith('</urlset>\n')).toBe(true);
  });

  it('emits lastmod, changefreq, priority when provided', () => {
    const xml = renderUrlsetXml([
      {
        loc: 'https://cleanstart.com/blogs/x',
        lastmod: '2026-05-05T12:00:00Z',
        changefreq: 'weekly',
        priority: 0.7,
      },
    ]);
    expect(xml).toContain('<lastmod>2026-05-05T12:00:00Z</lastmod>');
    expect(xml).toContain('<changefreq>weekly</changefreq>');
    expect(xml).toContain('<priority>0.7</priority>');
  });

  it('clamps out-of-range priority into [0,1]', () => {
    const xml = renderUrlsetXml([{ loc: 'https://x/', priority: 1.7 }]);
    expect(xml).toContain('<priority>1.0</priority>');
    const xml2 = renderUrlsetXml([{ loc: 'https://x/', priority: -0.4 }]);
    expect(xml2).toContain('<priority>0.0</priority>');
  });

  it('escapes the loc URL when it contains an ampersand or angle bracket', () => {
    const xml = renderUrlsetXml([{ loc: 'https://x/?a=1&b=2' }]);
    expect(xml).toContain('<loc>https://x/?a=1&amp;b=2</loc>');
  });

  it('omits lastmod when not set', () => {
    const xml = renderUrlsetXml([{ loc: 'https://x/' }]);
    expect(xml).not.toContain('<lastmod>');
  });

  describe('hreflang alternates', () => {
    it('omits the xhtml namespace when no entries have alternates', () => {
      const xml = renderUrlsetXml([{ loc: 'https://x/' }]);
      expect(xml).not.toContain('xmlns:xhtml');
      expect(xml).not.toContain('<xhtml:link');
    });

    it('adds the xhtml namespace + xhtml:link rows when entries carry alternates', () => {
      const xml = renderUrlsetXml([
        {
          loc: 'https://x/us/',
          alternates: [
            { hreflang: 'en-US', href: 'https://x/us/' },
            { hreflang: 'en-AE', href: 'https://x/ae/' },
            { hreflang: 'x-default', href: 'https://x/' },
          ],
        },
      ]);
      expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
      expect(xml).toContain(
        '<xhtml:link rel="alternate" hreflang="en-US" href="https://x/us/"/>',
      );
      expect(xml).toContain(
        '<xhtml:link rel="alternate" hreflang="en-AE" href="https://x/ae/"/>',
      );
      expect(xml).toContain(
        '<xhtml:link rel="alternate" hreflang="x-default" href="https://x/"/>',
      );
    });

    it('skips alternate rows missing hreflang or href', () => {
      const xml = renderUrlsetXml([
        {
          loc: 'https://x/us/',
          alternates: [
            { hreflang: '', href: 'https://x/us/' },
            { hreflang: 'en-AE', href: '' },
            { hreflang: 'en-US', href: 'https://x/us/' },
          ],
        },
      ]);
      expect(xml).toContain('hreflang="en-US"');
      expect(xml).not.toContain('hreflang=""');
    });

    it('escapes special characters inside alternate href', () => {
      const xml = renderUrlsetXml([
        {
          loc: 'https://x/',
          alternates: [{ hreflang: 'en-US', href: 'https://x/?a=1&b=2' }],
        },
      ]);
      expect(xml).toContain('href="https://x/?a=1&amp;b=2"');
    });

    it('emits the namespace once even when only some entries carry alternates', () => {
      const xml = renderUrlsetXml([
        { loc: 'https://x/a' },
        { loc: 'https://x/b', alternates: [{ hreflang: 'en', href: 'https://x/b' }] },
        { loc: 'https://x/c' },
      ]);
      // single occurrence of xmlns:xhtml in the root <urlset>
      expect(xml.match(/xmlns:xhtml/g)?.length).toBe(1);
    });
  });
});

describe('renderNewsUrlsetXml', () => {
  it('uses the news namespace and emits the news block per row', () => {
    const xml = renderNewsUrlsetXml([
      {
        loc: 'https://cleanstart.com/news/launch',
        publicationName: 'CleanStart',
        publicationLanguage: 'en',
        publicationDate: '2026-05-04T09:00:00Z',
        title: 'CleanStart launches v1',
      },
    ]);
    expect(xml).toContain('xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"');
    expect(xml).toContain('<news:news>');
    expect(xml).toContain('<news:name>CleanStart</news:name>');
    expect(xml).toContain('<news:language>en</news:language>');
    expect(xml).toContain('<news:publication_date>2026-05-04T09:00:00Z</news:publication_date>');
    expect(xml).toContain('<news:title>CleanStart launches v1</news:title>');
  });

  it('escapes special characters in the title', () => {
    const xml = renderNewsUrlsetXml([
      {
        loc: 'https://x/',
        publicationName: 'CleanStart',
        publicationLanguage: 'en',
        publicationDate: '2026-05-04T09:00:00Z',
        title: 'A & B < C',
      },
    ]);
    expect(xml).toContain('<news:title>A &amp; B &lt; C</news:title>');
  });
});
