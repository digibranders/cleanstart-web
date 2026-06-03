/**
 * GA4 Consent Mode v2 bootstrap, default-denied (WEB-PRODUCTION.md §11).
 *
 * Rendered as a STATIC inline <script> in the document head (see
 * components/consent/ConsentModeScript.tsx). It is cleared by a CSP
 * hash (not a per-request nonce) so the marketing site stays statically
 * prerendered — reading a nonce in the root layout would force every
 * route into dynamic rendering.
 *
 * IMPORTANT: if you edit `CONSENT_MODE_SNIPPET`, recompute the hash:
 *   node -e 'console.log("sha256-"+require("crypto").createHash("sha256").update(SNIPPET,"utf8").digest("base64"))'
 * and update `CONSENT_MODE_SNIPPET_HASH` + the value in lib/security/csp.ts.
 * The CSP is currently report-only, so a drift logs violations rather than
 * breaking the page — but it must stay in sync before CSP enforcement.
 */
export const CONSENT_MODE_SNIPPET =
  "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=window.gtag||gtag;gtag(\"consent\",\"default\",{analytics_storage:\"denied\",ad_storage:\"denied\",ad_user_data:\"denied\",ad_personalization:\"denied\",wait_for_update:500});";

/** sha256 (base64) of CONSENT_MODE_SNIPPET, for the CSP script-src hash. */
export const CONSENT_MODE_SNIPPET_HASH =
  "sha256-VUyRUSw+WbGIaKziru0SFOMvCBMapJMCM1Fy90LJfCA=";
