"use client";

import { Ga4Script } from "@/components/analytics/Ga4Script";
import { WebVitals } from "@/components/observability/WebVitals";
import { useConsent } from "./ConsentProvider";

/**
 * Renders behavioural analytics ONLY after the visitor grants the
 * Performance category (GDPR — no behavioural tracking before consent).
 * GA4 is gated here too (<Ga4Script/> self-noops when NEXT_PUBLIC_GA4_ID is
 * unset, e.g. on staging/preview). <WebVitals/> reports Core Web Vitals to
 * Sentry.
 *
 * Vercel <Analytics/> (Web Analytics) and <SpeedInsights/> were removed: both
 * are billable Vercel products, and GA4 + Search Console CrUX field data cover
 * the same ground for free. If either is ever re-enabled in the Vercel
 * dashboard, re-add its component here AND its dependency in package.json.
 */
export function GatedAnalytics() {
  const { performanceGranted } = useConsent();
  if (!performanceGranted) return null;
  return (
    <>
      <Ga4Script />
      <WebVitals />
    </>
  );
}
