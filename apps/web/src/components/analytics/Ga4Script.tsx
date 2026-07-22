"use client";

import Script from "next/script";
import { Suspense } from "react";

import { resolveGa4MeasurementId } from "@/lib/analytics/ga4";
import { Ga4RouteTracker } from "./Ga4RouteTracker";

/**
 * Loads the GA4 gtag.js library and initialises the configured property.
 *
 * GA4 measurement is intentionally UN-GATED: the head consent snippet
 * (lib/consent/consent-mode-snippet.ts) defaults `analytics_storage` to
 * granted, so the tag sets its cookies and sends full hits on every page load
 * regardless of the cookie banner. Advertising signals stay default-denied and
 * only flip on a Targeting opt-in via <ConsentProvider/>.
 *
 * The init script re-declares the dataLayer/gtag queue stub (Google's canonical
 * snippet shape) so it cannot throw if the head bootstrap ever failed — a bare
 * `gtag(…)` reference here would take the whole tag down with it.
 *
 * `gtag('config', …)` keeps its default initial page_view (queue-ordered, so it
 * can never race). SPA navigations are covered by <Ga4RouteTracker/>; the GA4
 * property's Enhanced Measurement "history events" toggle must stay OFF.
 *
 * Renders null when `NEXT_PUBLIC_GA4_ID` is unset/malformed OR the current host
 * is a noindex alias (staging / preview share the production build) — fail-safe:
 * no tag rather than a broken loader or polluted GA4 property. This component
 * only renders client-side meaningfully; during SSR `window` is undefined and
 * it renders null (next/script emits no DOM for afterInteractive, so there is
 * no hydration mismatch).
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
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=window.gtag||gtag;gtag('js', new Date());gtag('config', '${measurementId}');`}
      </Script>
      <Suspense fallback={null}>
        <Ga4RouteTracker />
      </Suspense>
    </>
  );
}
