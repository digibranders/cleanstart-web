/**
 * GA4 Consent Mode v2 bootstrap (WEB-PRODUCTION.md §11).
 *
 * `analytics_storage` is GRANTED by default: GA4 measurement is intentionally
 * NOT gated on the cookie banner (business decision, 2026-07-22 — the SEO team
 * needs unmodeled, complete traffic data). The advertising signals
 * (`ad_storage`, `ad_user_data`, `ad_personalization`) remain default-denied
 * and only flip on an explicit Targeting opt-in (see ConsentProvider).
 *
 * Rendered as a STATIC inline <script> in the document head (see
 * components/consent/ConsentModeScript.tsx). It runs under the CSP's
 * `script-src 'unsafe-inline'` (see lib/security/csp.ts) — the marketing
 * site is statically prerendered, so a per-request nonce isn't an option
 * (it would force dynamic rendering) and a hash buys nothing once
 * `'unsafe-inline'` is in effect.
 *
 * `CONSENT_MODE_SNIPPET_HASH` below is retained as documentation of the
 * snippet's integrity and for a possible future tightening to a
 * hash-pinned script-src; it is NOT currently wired into the CSP. If you
 * edit `CONSENT_MODE_SNIPPET`, recompute it:
 *   node -e 'console.log("sha256-"+require("crypto").createHash("sha256").update(SNIPPET,"utf8").digest("base64"))'
 */
export const CONSENT_MODE_SNIPPET =
  "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=window.gtag||gtag;gtag(\"consent\",\"default\",{analytics_storage:\"granted\",ad_storage:\"denied\",ad_user_data:\"denied\",ad_personalization:\"denied\",wait_for_update:500});";

/** sha256 (base64) of CONSENT_MODE_SNIPPET, for the CSP script-src hash. */
export const CONSENT_MODE_SNIPPET_HASH =
  "sha256-2qZt121yZ8M5DJPhdS0xzMFFSVGDPYiJzAyiUx1nX1Q=";
