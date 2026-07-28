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
