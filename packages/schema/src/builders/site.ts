/**
 * Site identity used by the JSON-LD builders. Mirrors the values in
 * `apps/web/src/lib/seo/canonical.ts` byte-for-byte (same env var, same
 * fallback) so the composed graph is identical whether built from the
 * web app or the CMS. Kept here so the package has no app dependency.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.cleanstart.com";
export const SITE_NAME = "CleanStart";

export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
