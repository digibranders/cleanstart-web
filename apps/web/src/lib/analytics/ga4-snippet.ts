import { NOINDEX_HOSTS, NOINDEX_HOST_SUFFIXES } from "@/lib/seo/indexing";

/**
 * Builds the GA4 bootstrap that ships INSIDE the server-rendered `<head>`.
 *
 * Why this exists as an inline string rather than a `next/script` component:
 * the tag must be present in the HTML source and must start loading before the
 * body is parsed. The previous implementation mounted `<Ga4Script/>` deep in the
 * body behind `typeof window === "undefined"` and `strategy="afterInteractive"`,
 * so gtag.js was injected only AFTER React hydrated — the served HTML contained
 * no measurement id at all (tag-detection tools saw nothing) and every hit was
 * gated on a successful hydration.
 *
 * The staging/preview host gate therefore has to run in the browser: the
 * marketing site is statically prerendered, so the root layout cannot read
 * `headers()` to learn the request host without forcing every route dynamic, and
 * the Vercel "Production" environment serves www AND the noindex aliases from the
 * SAME build (so `NEXT_PUBLIC_GA4_ID` is baked into both). Serializing the host
 * list from `lib/seo/indexing.ts` keeps one source of truth: a host we don't
 * index is a host we don't track.
 *
 * Ordering is safe by construction. This snippet is emitted after the Consent
 * Mode default in `<head>`, so `gtag('consent','default',…)` is already queued
 * before `config` runs. `config` keeps its own initial page_view (queue-ordered,
 * so it cannot race the loader); SPA navigations come from `<Ga4RouteTracker/>`
 * and the GA4 property's Enhanced Measurement "history events" toggle must stay
 * OFF or navigations double-count.
 *
 * The loader is injected `async`, matching Google's canonical snippet, so it
 * never blocks parsing or rendering.
 *
 * Runs under the CSP's `script-src 'self' 'unsafe-inline' https:` (see
 * lib/security/csp.ts): `'unsafe-inline'` clears this inline block and `https:`
 * clears the googletagmanager.com loader it appends.
 *
 * @param measurementId a `^G-[A-Z0-9]+$` id (validated by `ga4MeasurementId()`),
 *   which is why it is safe to interpolate into the string literals below — the
 *   character class admits no quote or script-breaking character.
 */
export function buildGa4Snippet(measurementId: string): string {
  const hosts = JSON.stringify(NOINDEX_HOSTS);
  const suffixes = JSON.stringify(NOINDEX_HOST_SUFFIXES);

  return `(function(){
var h=(location.hostname||"").toLowerCase();
if(!h)return;
if(${hosts}.indexOf(h)>-1)return;
if(${suffixes}.some(function(s){return h.slice(-s.length)===s}))return;
window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments)}
window.gtag=window.gtag||gtag;
gtag("js",new Date());
gtag("config","${measurementId}");
var s=document.createElement("script");
s.async=true;
s.src="https://www.googletagmanager.com/gtag/js?id=${measurementId}";
document.head.appendChild(s);
})();`;
}
