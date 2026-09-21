"use client";

import { Suspense } from "react";

import { Ga4RouteTracker } from "@/components/analytics/Ga4RouteTracker";
import { WebVitals } from "@/components/observability/WebVitals";
import { useConsent } from "./ConsentProvider";

/**
 * Renders the client-side analytics that still live in code.
 *
 * Third-party tags (GA4, Microsoft Clarity, Apollo.io, Leadfeeder) are NOT
 * mounted here. They live in the GTM container loaded by <GtmHeadScript/>.
 * Apollo and Leadfeeder used to mount here once `targetingGranted` was true; in
 * GTM they fire on the `cs_consent_update` event that <ConsentProvider/> pushes,
 * with a trigger condition on the Targeting flag. Clarity fires on the same
 * event, conditioned on the Performance flag, the same category <WebVitals/>
 * uses below. The full inventory is in docs/web/TRACKING-TAGS.md.
 *
 * GA4 stays UN-GATED from the cookie banner outside the EEA/UK/CH (business
 * decision, 2026-07-22): the head consent snippet defaults analytics_storage to
 * granted there, so the GA4 tag carries no extra GTM consent check.
 *
 * What is left here:
 *  - <Ga4RouteTracker/> pushes a page_view dataLayer event on SPA navigation
 *    (needs useSearchParams, hence <Suspense/>).
 *  - Performance → <WebVitals/> (Core Web Vitals to Sentry). This is our own
 *    reporting, not a vendor tag, so it stays in code.
 *
 * Vercel <Analytics/> (Web Analytics) and <SpeedInsights/> were removed: both
 * are billable Vercel products, and GA4 + Search Console CrUX field data cover
 * the same ground for free. If either is ever re-enabled in the Vercel
 * dashboard, re-add its component here AND its dependency in package.json.
 */
export function GatedAnalytics() {
  const { performanceGranted } = useConsent();
  return (
    <>
      <Suspense fallback={null}>
        <Ga4RouteTracker />
      </Suspense>
      {performanceGranted && <WebVitals />}
    </>
  );
}
