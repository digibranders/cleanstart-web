/**
 * Sitemap XML escaping + rendering. Kept minimal — sitemaps have a
 * narrow schema (a flat list of URLs with a few sub-elements), so
 * we don't need a full XML library.
 */

const XML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

/**
 * Escape a string for safe inclusion as XML text or attribute content.
 * Handles `&`, `<`, `>`, `"`, `'` per the XML 1.0 spec.
 */
export const xmlEscape = (raw: string): string =>
  raw.replace(/[&<>"']/g, (ch) => XML_ESCAPE_MAP[ch] ?? ch);

export type ChangeFreq =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never';

export interface SitemapEntry {
  /** Absolute URL — required. */
  readonly loc: string;
  /** ISO 8601 timestamp. */
  readonly lastmod?: string | null;
  readonly changefreq?: ChangeFreq;
  /** 0.0 – 1.0. Out-of-range values are clamped. */
  readonly priority?: number;
}

const renderEntry = (entry: SitemapEntry): string => {
  const parts: string[] = ['  <url>'];
  parts.push(`    <loc>${xmlEscape(entry.loc)}</loc>`);
  if (entry.lastmod) parts.push(`    <lastmod>${xmlEscape(entry.lastmod)}</lastmod>`);
  if (entry.changefreq) parts.push(`    <changefreq>${entry.changefreq}</changefreq>`);
  if (typeof entry.priority === 'number') {
    const clamped = Math.max(0, Math.min(1, entry.priority));
    parts.push(`    <priority>${clamped.toFixed(1)}</priority>`);
  }
  parts.push('  </url>');
  return parts.join('\n');
};

/**
 * Render a standard sitemap urlset document. Returns the full XML
 * payload including the prolog — caller writes it directly to the
 * response body.
 */
export const renderUrlsetXml = (entries: readonly SitemapEntry[]): string => {
  const body = entries.map(renderEntry).join('\n');
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    body,
    '</urlset>',
    '',
  ].join('\n');
};

export interface NewsSitemapEntry {
  readonly loc: string;
  readonly publicationName: string;
  readonly publicationLanguage: string;
  /** ISO 8601 W3C datetime. */
  readonly publicationDate: string;
  readonly title: string;
}

const renderNewsEntry = (entry: NewsSitemapEntry): string =>
  [
    '  <url>',
    `    <loc>${xmlEscape(entry.loc)}</loc>`,
    '    <news:news>',
    '      <news:publication>',
    `        <news:name>${xmlEscape(entry.publicationName)}</news:name>`,
    `        <news:language>${xmlEscape(entry.publicationLanguage)}</news:language>`,
    '      </news:publication>',
    `      <news:publication_date>${xmlEscape(entry.publicationDate)}</news:publication_date>`,
    `      <news:title>${xmlEscape(entry.title)}</news:title>`,
    '    </news:news>',
    '  </url>',
  ].join('\n');

/**
 * Render the Google News sitemap urlset. Different namespace from
 * the standard sitemap — Google's spec is strict about it.
 */
export const renderNewsUrlsetXml = (entries: readonly NewsSitemapEntry[]): string =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">',
    entries.map(renderNewsEntry).join('\n'),
    '</urlset>',
    '',
  ].join('\n');
