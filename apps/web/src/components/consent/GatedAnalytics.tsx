"use client";

import { Suspense } from "react";

import { ApolloScript } from "@/components/analytics/ApolloScript";
import { Ga4RouteTracker } from "@/components/analytics/Ga4RouteTracker";
import { LeadfeederScript } from "@/components/analytics/LeadfeederScript";
import { WebVitals } from "@/components/observability/WebVitals";
import { useConsent } from "./ConsentProvider";

/**
 * Renders third-party tracking.
 *
 * The GA4 tag itself is NOT mounted here — it is server-rendered in the document
 * head by <Ga4HeadScript/> so it appears in the HTML source and loads before
 * hydration. All that remains client-side is <Ga4RouteTracker/>, which emits
 * `page_view` on SPA navigations (it needs `useSearchParams`, hence <Suspense/>).
 *
 * GA4 fires on EVERY page load and is fully UN-GATED from the cookie banner
 * (business decision, 2026-07-22): the head consent snippet defaults
 * `analytics_storage` to granted, so gtag.js sets its cookies and sends complete,
 * unmodeled hits regardless of the visitor's banner choice. Advertising signals
 * (`ad_storage` &c.) stay default-denied and follow the Targeting category via
 * <ConsentProvider/>.
 *
 * The remaining tools stay category-gated (they DO store/profile pre-consent, so
 * they cannot ride Advanced Consent Mode):
 *  - Performance → <WebVitals/> (Core Web Vitals to Sentry).
 *  - Targeting → <LeadfeederScript/> reverse-IP company identification — B2B
 *    lead-gen (advertising/profiling, not aggregate analytics), self-noops when
 *    NEXT_PUBLIC_LEADFEEDER_ID is unset.
 *  - Targeting → <ApolloScript/> Apollo.io website visitor tracker — B2B
 *    identification/profiling for outbound sales, self-noops when
 *    NEXT_PUBLIC_APOLLO_APP_ID is unset.
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
      <Suspense fallback={null}>
        <Ga4RouteTracker />
      </Suspense>
      {performanceGranted && <WebVitals />}
      {targetingGranted && <LeadfeederScript />}
      {targetingGranted && <ApolloScript />}
    </>
  );
}
