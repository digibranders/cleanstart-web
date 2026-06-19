"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { Ga4Script } from "@/components/analytics/Ga4Script";
import { WebVitals } from "@/components/observability/WebVitals";
import { useConsent } from "./ConsentProvider";

/**
 * Renders behavioural analytics ONLY after the visitor grants the
 * Performance category. Replaces the unconditional <Analytics/> /
 * <SpeedInsights/> / <WebVitals/> in layout.tsx (GDPR — no behavioural
 * tracking before consent). GA4 is gated here too (<Ga4Script/> self-noops
 * when NEXT_PUBLIC_GA4_ID is unset, e.g. on staging/preview).
 */
export function GatedAnalytics() {
  const { performanceGranted } = useConsent();
  if (!performanceGranted) return null;
  return (
    <>
      <Ga4Script />
      <Analytics />
      <SpeedInsights />
      <WebVitals />
    </>
  );
}
