/**
 * GA4 Consent Mode v2 bootstrap (WEB-PRODUCTION.md §11).
 *
 * `analytics_storage` defaults to GRANTED outside the EEA/UK/Switzerland: GA4
 * measurement is intentionally NOT gated on the cookie banner for those markets
 * (business decision, 2026-07-22 — the SEO team needs unmodeled, complete
 * traffic data). Inside `CONSENT_REQUIRED_REGIONS` it defaults to DENIED, since
 * a blanket grant is not defensible under GDPR Art 6 / ePrivacy Art 5(3).
 * Google resolves the visitor's region server-side from the request, so this
 * needs no geo-IP plumbing on our side.
 *
 * The advertising signals (`ad_storage`, `ad_user_data`, `ad_personalization`)
 * are default-denied EVERYWHERE and only flip on an explicit Targeting opt-in
 * (see ConsentProvider). Since 2026-06-15 `ad_storage` is the sole control over
 * whether GA4 advertising data reaches Google Ads.
 *
 * IMPORTANT — how this interacts with `gtag('consent','update')`:
 * `consent update` takes no `region` parameter, so any value it sends applies
 * to the visitor globally and would clobber the regional default above. The
 * provider therefore only ever sends `analytics_storage` to GRANT it on an
 * explicit opt-in, and omits the key otherwise (omitted signals retain their
 * current value). That keeps EEA rejections denied while leaving the
 * rest-of-world default grant intact. Do not "simplify" this by always sending
 * `analytics_storage` — that silently defeats the regional default.
 *
 * Rendered as a STATIC inline <script> in the document head (see
 * components/consent/ConsentModeScript.tsx), immediately BEFORE the GA4
 * bootstrap so these defaults are queued before `gtag('config', …)` runs. It
 * runs under the CSP's `script-src 'unsafe-inline'` (see lib/security/csp.ts) —
 * the marketing site is statically prerendered, so a per-request nonce isn't an
 * option (it would force dynamic rendering) and a hash buys nothing once
 * `'unsafe-inline'` is in effect.
 *
 * `CONSENT_MODE_SNIPPET_HASH` below is retained as documentation of the
 * snippet's integrity and for a possible future tightening to a
 * hash-pinned script-src; it is NOT currently wired into the CSP. If you
 * edit `CONSENT_MODE_SNIPPET`, recompute it:
 *   node -e 'console.log("sha256-"+require("crypto").createHash("sha256").update(SNIPPET,"utf8").digest("base64"))'
 * The consent-mode-snippet test asserts the two stay in sync, so a stale hash
 * fails CI rather than going unnoticed.
 */

/**
 * Markets where non-essential storage requires prior opt-in: the 30 EEA states
 * (EU-27 + IS/LI/NO) plus the UK (UK GDPR) and Switzerland (revised FADP).
 * ISO 3166-1 alpha-2, matching Google's `region` parameter.
 */
export const CONSENT_REQUIRED_REGIONS: readonly string[] = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
  "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
  "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  "IS", "LI", "NO",
  "GB", "CH",
];

const DENIED_ADS =
  'ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied"';

// Region-specific default is declared first (the more specific region wins
// regardless of order, but leading with it keeps the intent obvious in source);
// the second, region-less default covers every other visitor.
export const CONSENT_MODE_SNIPPET = `window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments)}
window.gtag=window.gtag||gtag;
gtag("consent","default",{analytics_storage:"denied",${DENIED_ADS},region:${JSON.stringify(CONSENT_REQUIRED_REGIONS)},wait_for_update:500});
gtag("consent","default",{analytics_storage:"granted",${DENIED_ADS},wait_for_update:500});`;

/** sha256 (base64) of CONSENT_MODE_SNIPPET, for the CSP script-src hash. */
export const CONSENT_MODE_SNIPPET_HASH =
  "sha256-zqPdGi6eIt30CiF+sRkAz9DLXMlasZdCm1DtDWOVvgc=";
