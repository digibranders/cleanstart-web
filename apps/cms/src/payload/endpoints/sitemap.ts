import type { Endpoint, Payload } from 'payload';

import {
  type SitemapPayload,
  collectNewsSitemapEntries,
  collectSitemapEntries,
} from '../lib/sitemap/collect';
import { renderNewsUrlsetXml, renderUrlsetXml } from '../lib/sitemap/xml';

const xmlResponse = (xml: string): Response =>
  new Response(xml, {
    status: 200,
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });

const readBaseUrl = async (payload: Payload): Promise<string> => {
  const settings = (await payload.findGlobal({ slug: 'siteSettings' })) as {
    baseUrl?: string;
  };
  return (settings.baseUrl ?? 'https://cleanstart.com').replace(/\/+$/, '');
};

interface NewsContext {
  publicationName: string;
  publicationLanguage: string;
}

const readNewsContext = async (payload: Payload): Promise<NewsContext> => {
  const settings = (await payload.findGlobal({ slug: 'siteSettings' })) as {
    siteName?: string;
    defaultLocale?: string;
  };
  const language = (settings.defaultLocale ?? 'en-US').split('-')[0] ?? 'en';
  return {
    publicationName: settings.siteName ?? 'CleanStart',
    publicationLanguage: language,
  };
};

/**
 * GET /api/sitemap.xml
 *
 * Standard sitemap covering every published, indexable document
 * across the routable collections. Cached for 1 hour at the edge —
 * Phase G will add an explicit revalidation hook on publish/archive
 * so editors don't wait an hour to see a new doc indexed.
 */
export const sitemapEndpoint: Endpoint = {
  path: '/sitemap.xml',
  method: 'get',
  handler: async (req) => {
    const baseUrl = await readBaseUrl(req.payload);
    const entries = await collectSitemapEntries(
      req.payload as unknown as SitemapPayload,
      baseUrl,
    );
    return xmlResponse(renderUrlsetXml(entries));
  },
};

/**
 * GET /api/sitemap-news.xml
 *
 * Google News sitemap — last 48 hours of published news, max 1000
 * URLs, with the news-spec namespace. Pairs with NewsArticle JSON-LD
 * (`isAccessibleForFree: true`) and the site-level
 * NewsMediaOrganization schema (Phase F4) to satisfy Google News
 * eligibility (manual applications retired October 2025; entry is
 * signals-based now).
 */
export const newsSitemapEndpoint: Endpoint = {
  path: '/sitemap-news.xml',
  method: 'get',
  handler: async (req) => {
    const [baseUrl, news] = await Promise.all([
      readBaseUrl(req.payload),
      readNewsContext(req.payload),
    ]);
    const entries = await collectNewsSitemapEntries(
      req.payload as unknown as SitemapPayload,
      {
        baseUrl,
        publicationName: news.publicationName,
        publicationLanguage: news.publicationLanguage,
      },
    );
    return xmlResponse(renderNewsUrlsetXml(entries));
  },
};
