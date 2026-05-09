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

export interface HreflangAlternate {
  readonly hreflang: string;
  readonly href: string;
}

export interface SitemapEntry {
  /** Absolute URL — required. */
  readonly loc: string;
  /** ISO 8601 timestamp. */
  readonly lastmod?: string | null;
  readonly changefreq?: ChangeFreq;
  /** 0.0 – 1.0. Out-of-range values are clamped. */
  readonly priority?: number;
  /**
   * Optional hreflang cluster for this URL. When non-empty, each row
   * is emitted as `<xhtml:link rel="alternate" hreflang="…" href="…"/>`
   * inside the `<url>` element. Caller is responsible for cluster
   * symmetry (self-ref, x-default) — this lib emits whatever it's
   * given. Use `composeHreflangCluster()` upstream to inject defaults.
   */
  readonly alternates?: ReadonlyArray<HreflangAlternate>;
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
  if (entry.alternates && entry.alternates.length > 0) {
    for (const alt of entry.alternates) {
      const hreflang = (alt.hreflang ?? '').trim();
      const href = (alt.href ?? '').trim();
      if (!hreflang || !href) continue;
      parts.push(
        `    <xhtml:link rel="alternate" hreflang="${xmlEscape(hreflang)}" href="${xmlEscape(href)}"/>`,
      );
    }
  }
  parts.push('  </url>');
  return parts.join('\n');
};

const hasAnyAlternates = (entries: readonly SitemapEntry[]): boolean =>
  entries.some((e) => Array.isArray(e.alternates) && e.alternates.length > 0);

/**
 * Render a standard sitemap urlset document. Returns the full XML
 * payload including the prolog — caller writes it directly to the
 * response body.
 *
 * When ANY entry has hreflang alternates, the root `<urlset>` opens
 * with the `xhtml` namespace so `<xhtml:link>` children validate.
 * The namespace is omitted otherwise to keep the document minimal
 * for sites without multi-locale clusters.
 */
export const renderUrlsetXml = (entries: readonly SitemapEntry[]): string => {
  const body = entries.map(renderEntry).join('\n');
  const root = hasAnyAlternates(entries)
    ? '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:xhtml="http://www.w3.org/1999/xhtml">'
    : '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  return ['<?xml version="1.0" encoding="UTF-8"?>', root, body, '</urlset>', ''].join('\n');
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

export interface ImageSitemapEntry {
  readonly loc: string;
  readonly images: ReadonlyArray<{
    readonly loc: string;
    readonly caption?: string | null;
    readonly title?: string | null;
  }>;
}

const renderImageEntry = (entry: ImageSitemapEntry): string => {
  const lines: string[] = ['  <url>', `    <loc>${xmlEscape(entry.loc)}</loc>`];
  for (const image of entry.images) {
    lines.push('    <image:image>');
    lines.push(`      <image:loc>${xmlEscape(image.loc)}</image:loc>`);
    if (image.caption && image.caption.length > 0) {
      lines.push(`      <image:caption>${xmlEscape(image.caption)}</image:caption>`);
    }
    if (image.title && image.title.length > 0) {
      lines.push(`      <image:title>${xmlEscape(image.title)}</image:title>`);
    }
    lines.push('    </image:image>');
  }
  lines.push('  </url>');
  return lines.join('\n');
};

/**
 * Render the Google image sitemap urlset. Wraps the standard
 * sitemap.xml namespace with the `image:` namespace so each `<url>`
 * can carry one or more `<image:image>` children.
 */
export const renderImageUrlsetXml = (
  entries: readonly ImageSitemapEntry[],
): string =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    entries.map(renderImageEntry).join('\n'),
    '</urlset>',
    '',
  ].join('\n');
