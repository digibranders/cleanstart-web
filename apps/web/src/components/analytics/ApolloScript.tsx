"use client";

import Script from "next/script";

import { resolveApolloAppId } from "@/lib/analytics/apollo";

/**
 * Loads the Apollo.io website visitor tracker.
 *
 * Mounted INSIDE <GatedAnalytics/>, so it renders only after the visitor grants
 * the Targeting category — Apollo identifies visiting companies/contacts for
 * B2B lead-gen, which is advertising/profiling, not aggregate analytics, so it
 * gates on `targetingGranted` (ad_storage), not the GA4 performance gate.
 *
 * Renders null when `NEXT_PUBLIC_APOLLO_APP_ID` is unset/malformed OR the
 * current host is a noindex alias (staging / preview share the production
 * build) — fail-safe: no tag rather than a broken loader or polluted account.
 * This component only renders client-side (its parent <GatedAnalytics/> returns
 * null until the consent state resolves in an effect), so `window` is always
 * defined here.
 *
 * The inline stub mirrors Apollo's official snippet: it fetches
 * `assets.apollo.io/micro/website-tracker/tracker.iife.js` with a random
 * cache-buster and calls `window.trackingFunctions.onLoad({appId})` once the
 * loader arrives. The app id is validated to a 24-char hex ObjectId by
 * resolveApolloAppId, so it is safe to interpolate into the inline stub.
 */
export function ApolloScript() {
  const appId =
    typeof window === "undefined"
      ? null
      : resolveApolloAppId(window.location.hostname);
  if (!appId) return null;

  const snippet = `(function(){var n=Math.random().toString(36).substring(7),o=document.createElement("script");o.src="https://assets.apollo.io/micro/website-tracker/tracker.iife.js?nocache="+n;o.async=true;o.defer=true;o.onload=function(){window.trackingFunctions.onLoad({appId:"${appId}"})};document.head.appendChild(o)})();`;

  return (
    <Script id="apollo-init" strategy="afterInteractive">
      {snippet}
    </Script>
  );
}
