"use client";

import Script from "next/script";

import { resolveLeadfeederAccountId } from "@/lib/analytics/leadfeeder";

/**
 * Loads the Leadfeeder / Dealfront visitor-identification tracker.
 *
 * Mounted INSIDE <GatedAnalytics/>, so it renders only after the visitor grants
 * the Targeting category — Leadfeeder reverse-IP-identifies visiting companies
 * for B2B lead-gen, which is advertising/profiling, not aggregate analytics, so
 * it gates on `targetingGranted` (ad_storage), not the GA4 performance gate.
 *
 * Renders null when `NEXT_PUBLIC_LEADFEEDER_ID` is unset/malformed OR the
 * current host is a noindex alias (staging / preview share the production
 * build) — fail-safe: no tag rather than a broken loader or polluted account.
 * This component only renders client-side (its parent <GatedAnalytics/> returns
 * null until the consent state resolves in an effect), so `window` is always
 * defined here.
 *
 * The inline stub mirrors Leadfeeder's official snippet: it defines the
 * `window.ldfdr` command queue so any early calls are buffered until the loader
 * (sc.lfeeder.com) finishes. The account id is validated to `[A-Za-z0-9]+` by
 * resolveLeadfeederAccountId, so it is safe to interpolate into both the inline
 * stub and the loader URL.
 */
export function LeadfeederScript() {
  const accountId =
    typeof window === "undefined"
      ? null
      : resolveLeadfeederAccountId(window.location.hostname);
  if (!accountId) return null;

  return (
    <>
      <Script id="leadfeeder-init" strategy="afterInteractive">
        {"window.ldfdr=window.ldfdr||function(){(ldfdr._q=ldfdr._q||[]).push([].slice.call(arguments));};"}
      </Script>
      <Script
        id="leadfeeder-loader"
        src={`https://sc.lfeeder.com/lftracker_v1_${accountId}.js`}
        strategy="afterInteractive"
      />
    </>
  );
}
