"use client";

import { Ga4Script } from "@/components/analytics/Ga4Script";
import { LeadfeederScript } from "@/components/analytics/LeadfeederScript";
import { WebVitals } from "@/components/observability/WebVitals";
import { useConsent } from "./ConsentProvider";

/**
 * Renders third-party tracking ONLY after the visitor grants the matching
 * consent category (GDPR — no tracking before consent). Each tool is gated
 * independently:
 *
 *  - Performance → GA4 (<Ga4Script/>, self-noops when NEXT_PUBLIC_GA4_ID is
 *    unset, e.g. on staging/preview) + <WebVitals/> (Core Web Vitals to Sentry).
 *  - Targeting → Leadfeeder/Dealfront visitor identification
 *    (<LeadfeederScript/>, self-noops when NEXT_PUBLIC_LEADFEEDER_ID is unset).
 *    It reverse-IP-identifies visiting companies for B2B lead-gen — advertising/
 *    profiling, not aggregate analytics — so it rides the targeting gate.
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
      {performanceGranted && (
        <>
          <Ga4Script />
          <WebVitals />
        </>
      )}
      {targetingGranted && <LeadfeederScript />}
    </>
  );
}
