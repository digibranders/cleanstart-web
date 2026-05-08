import type { Endpoint, Payload } from 'payload';

const SITEMAP_PATHS = [
  '/api/sitemap.xml',
  '/api/sitemap-news.xml',
  '/api/sitemap-image.xml',
] as const;

const textResponse = (body: string): Response =>
  new Response(body, {
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });

const readBaseUrl = async (payload: Payload): Promise<string> => {
  const settings = (await payload.findGlobal({ slug: 'siteSettings' })) as {
    baseUrl?: string;
  };
  return (settings.baseUrl ?? 'https://cleanstart.com').replace(/\/+$/, '');
};

// Production = explicit signal only. Staging deploys run with
// NODE_ENV=production but should still be Disallow: /, so we require
// PAYLOAD_PUBLIC_ENV=production to flip the switch and let the
// PAYLOAD_PUBLIC_ROBOTS_DISALLOW kill-switch override even that.
const shouldAllowIndexing = (): boolean => {
  if (process.env.PAYLOAD_PUBLIC_ROBOTS_DISALLOW === '1') return false;
  return process.env.PAYLOAD_PUBLIC_ENV === 'production';
};

const renderAllow = (baseUrl: string): string => {
  const sitemaps = SITEMAP_PATHS.map((p) => `Sitemap: ${baseUrl}${p}`).join('\n');
  return `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\n${sitemaps}\n`;
};

const renderDisallow = (): string => 'User-agent: *\nDisallow: /\n';

/**
 * GET /api/robots.txt
 *
 * Env-aware. Defaults to `Disallow: /` everywhere except when
 * `PAYLOAD_PUBLIC_ENV=production` — which keeps staging droplets and
 * preview deploys out of search indexes even when they run with
 * NODE_ENV=production. `PAYLOAD_PUBLIC_ROBOTS_DISALLOW=1` is a
 * kill-switch that forces disallow regardless.
 */
export const robotsEndpoint: Endpoint = {
  path: '/robots.txt',
  method: 'get',
  handler: async (req) => {
    if (!shouldAllowIndexing()) {
      return textResponse(renderDisallow());
    }
    const baseUrl = await readBaseUrl(req.payload);
    return textResponse(renderAllow(baseUrl));
  },
};
