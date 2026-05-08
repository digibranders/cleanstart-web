import type { JsonLdContext } from './context';
import { imageObjectFromMedia, type ResolvedMedia } from './shared';
import type { JsonLdBlob } from './types';

/**
 * Schema.org WebPage variants we emit. Defaults to plain `WebPage`;
 * `/about` upgrades to `AboutPage`, `/contact` to `ContactPage`. These
 * subclasses unlock specific Rich Results panels (knowledge-panel
 * "About" tab, contact info card) without changing the core fields.
 */
export type WebPageVariant =
  | 'WebPage'
  | 'AboutPage'
  | 'ContactPage'
  | 'CollectionPage';

export interface WebPageSource {
  /** Canonical absolute URL — `@id` and `url`. */
  readonly url: string;
  readonly title: string;
  readonly description?: string | null;
  readonly heroImage?: ResolvedMedia | null;
  readonly datePublished?: string | null;
  readonly dateModified?: string | null;
  readonly variant?: WebPageVariant;
}

/**
 * Choose a WebPage variant from a doc's site path. Pages whose `path`
 * resolves to `/about`, `/about-us`, or `/contact` get the matching
 * subclass; everything else stays a plain WebPage. Keep this list
 * tight — every entry is a marketing-team commitment.
 */
export const webPageVariantForPath = (path: string | null | undefined): WebPageVariant => {
  if (!path) return 'WebPage';
  const normalized = path.toLowerCase().replace(/\/+$/, '');
  switch (normalized) {
    case '/about':
    case '/about-us':
    case '/company':
      return 'AboutPage';
    case '/contact':
    case '/contact-us':
      return 'ContactPage';
    default:
      return 'WebPage';
  }
};

/**
 * Build the WebPage blob. Returns null only when title or url is
 * missing — every other field is genuinely optional per schema.org.
 */
export const buildWebPageBlob = (
  ctx: JsonLdContext,
  source: WebPageSource,
): JsonLdBlob | null => {
  if (!source.title || !source.url) return null;

  const blob: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': source.variant ?? 'WebPage',
    '@id': source.url,
    url: source.url,
    name: source.title,
    inLanguage: ctx.site.defaultLocale,
    isPartOf: { '@id': `${ctx.site.baseUrl}/#website` },
    publisher: { '@id': ctx.organizationId },
  };

  if (source.description) blob.description = source.description;

  const image = imageObjectFromMedia(source.heroImage);
  if (image) blob.primaryImageOfPage = image;

  if (source.datePublished) blob.datePublished = source.datePublished;
  if (source.dateModified) blob.dateModified = source.dateModified;

  return blob as JsonLdBlob;
};
