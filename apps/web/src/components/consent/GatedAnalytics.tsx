"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { WebVitals } from "@/components/observability/WebVitals";
import { useConsent } from "./ConsentProvider";

/**
 * Renders behavioural analytics ONLY after the visitor grants the
 * Analytics category. Replaces the unconditional <Analytics/> /
 * <SpeedInsights/> / <WebVitals/> in layout.tsx (GDPR — no behavioural
 * tracking before consent).
 */
export function GatedAnalytics() {
  const { analyticsGranted } = useConsent();
  if (!analyticsGranted) return null;
  return (
    <>
      <Analytics />
      <SpeedInsights />
      <WebVitals />
    </>
  );
}
