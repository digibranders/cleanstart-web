import type { JsonLdContext } from './context';
import type { JsonLdBlob } from './types';

/**
 * Site-wide WebSite blob. Provides the canonical site URL and
 * `inLanguage`. The optional SearchAction (sitelinks search box) is
 * deferred until the site exposes a public search endpoint —
 * emitting it without a working `target` URL is worse than not
 * emitting it.
 */
export const buildWebsiteBlob = (ctx: JsonLdContext): JsonLdBlob => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${ctx.site.baseUrl}/#website`,
  name: ctx.site.siteName,
  url: ctx.site.baseUrl,
  inLanguage: ctx.site.defaultLocale,
  publisher: { '@id': ctx.organizationId },
});
