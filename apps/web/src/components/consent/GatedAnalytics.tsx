"use client";

import { Ga4Script } from "@/components/analytics/Ga4Script";
import { LeadfeederScript } from "@/components/analytics/LeadfeederScript";
import { WebVitals } from "@/components/observability/WebVitals";
import { useConsent } from "./ConsentProvider";

/**
 * Renders third-party tracking.
 *
 * GA4 (<Ga4Script/>) loads on EVERY page load and is fully UN-GATED from the
 * cookie banner (business decision, 2026-07-22): the head consent snippet
 * defaults `analytics_storage` to granted, so gtag.js sets its cookies and
 * sends complete, unmodeled hits regardless of the visitor's banner choice.
 * Advertising signals (`ad_storage` &c.) stay default-denied and follow the
 * Targeting category via <ConsentProvider/>. <Ga4Script/> still self-noops
 * when NEXT_PUBLIC_GA4_ID is unset (staging/preview) or on a noindex host.
 *
 * The remaining tools stay category-gated (they DO store/profile pre-consent, so
 * they cannot ride Advanced Consent Mode):
 *  - Performance → <WebVitals/> (Core Web Vitals to Sentry).
 *  - Targeting → <LeadfeederScript/> reverse-IP company identification — B2B
 *    lead-gen (advertising/profiling, not aggregate analytics), self-noops when
 *    NEXT_PUBLIC_LEADFEEDER_ID is unset.
 *
 * Vercel <Analytics/> (Web Analytics) and <SpeedInsights/> were removed: both
 * are billable Vercel products, and GA4 + Search Console CrUX field data cover
 * the same ground for free. If either is ever re-enabled in the Vercel
 * dashboard, re-add its component here AND its dependency in package.json.
 */
export function GatedAnalytics() {
  const { performanceGranted, targetingGranted } = useConsent();
  return (
    <>
      <Ga4Script />
      {performanceGranted && <WebVitals />}
      {targetingGranted && <LeadfeederScript />}
    </>
  );
}
