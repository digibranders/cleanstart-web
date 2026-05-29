/**
 * Single source of truth for the public site URL used by SEO sidebar
 * components. Reads NEXT_PUBLIC_SITE_URL at runtime (client-safe env var)
 * and falls back to the production domain.
 *
 * Previously each component declared its own copy, leading to subtle
 * drift (different fallbacks, different process-guard patterns). Import
 * this constant instead.
 */
export const DEFAULT_SITE_URL: string =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SITE_URL) ||
  'https://cleanstart.com';
