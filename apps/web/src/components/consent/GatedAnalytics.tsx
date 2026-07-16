"use client";

import { Ga4Script } from "@/components/analytics/Ga4Script";
import { LeadfeederScript } from "@/components/analytics/LeadfeederScript";
import { WebVitals } from "@/components/observability/WebVitals";
import { useConsent } from "./ConsentProvider";

/**
 * Renders third-party tracking under Google **Advanced Consent Mode v2**.
 *
 * GA4 (<Ga4Script/>) loads on EVERY page load — it is intentionally NOT gated on
 * the Performance category. This is safe because <ConsentModeScript/> (in <head>)
 * sets all Consent Mode v2 signals to `denied` by default, so before the visitor
 * accepts, gtag.js sets NO `_ga`/`_gid` cookies and stores NO identifier on the
 * device — it only sends cookieless modeling pings. The ePrivacy consent trigger
 * (storage/read on the device) is therefore not hit pre-consent, while Google can
 * still model the un-consented audience (recovering the ~half of traffic that
 * Basic Consent Mode dropped). On "Accept", <ConsentProvider/> fires
 * `gtag('consent','update', granted)` within the snippet's `wait_for_update:500`
 * window, so the first hit for a returning consented visitor is a full,
 * cookie-backed page_view. <Ga4Script/> still self-noops when NEXT_PUBLIC_GA4_ID
 * is unset (staging/preview) or on a noindex host.
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
