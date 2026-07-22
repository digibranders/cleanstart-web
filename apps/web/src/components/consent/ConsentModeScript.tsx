import { CONSENT_MODE_SNIPPET } from "@/lib/consent/consent-mode-snippet";

/**
 * GA4 Consent Mode v2 bootstrap. Emits a STATIC inline <script> in the
 * document head that grants `analytics_storage` (GA4 is un-gated — see
 * lib/consent/consent-mode-snippet.ts) and denies the advertising signals
 * before any tag runs. The ConsentProvider fires `gtag('consent','update', …)`
 * for the ad/functionality signals when the visitor decides.
 *
 * This runs before any analytics tag; the GA4 tag
 * (components/analytics/Ga4Script.tsx) relies on the `window.gtag` /
 * `dataLayer` queue this snippet bootstraps.
 *
 * Cleared by a CSP hash (see lib/security/csp.ts), NOT a per-request
 * nonce — a nonce would require reading headers() in the root layout,
 * which forces the entire marketing site into dynamic rendering.
 */
export function ConsentModeScript() {
  return (
    <script
      id="consent-mode-default"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: static, hash-pinned consent bootstrap (no user input); CSP-cleared via sha256 in csp.ts.
      dangerouslySetInnerHTML={{ __html: CONSENT_MODE_SNIPPET }}
    />
  );
}
