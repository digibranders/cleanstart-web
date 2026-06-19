import { isNoindexHost } from "@/lib/seo/indexing";

/**
 * GA4 measurement ID for this deployment, sourced from `NEXT_PUBLIC_GA4_ID`.
 *
 * Set only on the production deploy (WEB-PRODUCTION.md §17, "Production only");
 * the tag carries no dependency on CMS availability. The matching CMS field
 * (`siteSettings.analytics.ga4MeasurementId`) is retained for the Phase-J2
 * analytics dashboard's display only — it does NOT fire the live tag.
 *
 * Validation mirrors the CMS field's `^G-[A-Z0-9]+$` rule so a malformed value
 * fails the same way in both places. Read at call time (not module scope) so the
 * value is stubbable in tests and so a typo fails safe — the caller renders
 * nothing rather than injecting a broken loader. Because the returned id is
 * validated against this character class, it is safe to interpolate into the
 * gtag URL and the inline init script (no quote/script-breaking characters).
 */
const GA4_ID_PATTERN = /^G-[A-Z0-9]+$/;

export function ga4MeasurementId(): string | null {
  const id = process.env.NEXT_PUBLIC_GA4_ID?.trim();
  return id && GA4_ID_PATTERN.test(id) ? id : null;
}

/**
 * Resolve whether — and with which id — GA4 should load for a given host.
 *
 * The Vercel "Production" environment serves BOTH the canonical site
 * (www.cleanstart.com) and its noindex QA alias (staging.cleanstart.com) from
 * the SAME build, so `NEXT_PUBLIC_GA4_ID` is baked into both. Env scoping alone
 * therefore can't keep staging/preview traffic out of the production GA4
 * property — a runtime host check is required. We reuse `isNoindexHost` (the
 * single source of truth for "hosts we don't index"): a host we don't index is
 * a host we don't track. A missing host fails safe to "don't load".
 *
 * Note: local dev is already excluded because `NEXT_PUBLIC_GA4_ID` is unset
 * there (production-only), so `ga4MeasurementId()` returns null before this even
 * checks the host.
 *
 * @returns the measurement id to load, or null to render nothing.
 */
export function resolveGa4MeasurementId(
  hostname: string | null | undefined,
): string | null {
  const id = ga4MeasurementId();
  if (!id) return null;
  if (!hostname || isNoindexHost(hostname)) return null;
  return id;
}
