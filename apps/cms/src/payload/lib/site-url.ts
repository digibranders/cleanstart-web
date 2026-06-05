/**
 * Resolves the public web frontend origin (no trailing slash).
 *
 * The frontend host is **environment-driven**: `NEXT_PUBLIC_SITE_URL` is the
 * single lever — `https://staging.cleanstart.com` today, flip to
 * `https://cleanstart.com` at go-live. It falls back to the `siteSettings.baseUrl`
 * CMS field, then to the production domain as a last resort.
 *
 * Used everywhere the CMS emits a public web URL (sitemap, robots, JSON-LD,
 * IndexNow ping, outbound webhooks, search-index doc URLs) so the whole CMS
 * follows one env var instead of a hardcoded host.
 */
export const resolveSiteUrl = (settingsBaseUrl?: string | null): string =>
  (process.env.NEXT_PUBLIC_SITE_URL || settingsBaseUrl || 'https://cleanstart.com').replace(
    /\/+$/,
    '',
  );
