"use client";

import Script from "next/script";

import { resolveGa4MeasurementId } from "@/lib/analytics/ga4";

/**
 * Loads the GA4 gtag.js library and initialises the configured property.
 *
 * Mounted UNCONDITIONALLY by <GatedAnalytics/> under Advanced Consent Mode v2:
 * gtag.js loads on every page, but <ConsentModeScript/> (in <head>) has already
 * bootstrapped `window.dataLayer` + `window.gtag` with all Consent Mode v2
 * signals default-denied. Pre-consent, gtag.js therefore stores no cookie/
 * identifier and sends only cookieless modeling pings; on "Accept",
 * <ConsentProvider/> fires `gtag('consent','update', …)` granting
 * `analytics_storage` within the snippet's `wait_for_update` window, so gtag.js
 * begins storing and sends full hits.
 *
 * Renders null when `NEXT_PUBLIC_GA4_ID` is unset/malformed OR the current host
 * is a noindex alias (staging / preview share the production build) — fail-safe:
 * no tag rather than a broken loader or polluted GA4 property. This component
 * only renders client-side (its parent <GatedAnalytics/> returns null until the
 * consent state resolves in an effect), so `window` is always defined here.
 */
export function Ga4Script() {
  const measurementId =
    typeof window === "undefined"
      ? null
      : resolveGa4MeasurementId(window.location.hostname);
  if (!measurementId) return null;

  return (
    <>
      <Script
        id="ga4-loader"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`gtag('js', new Date());gtag('config', '${measurementId}');`}
      </Script>
    </>
  );
}
