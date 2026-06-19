import { CONSENT_MODE_SNIPPET } from "@/lib/consent/consent-mode-snippet";

/**
 * GA4 Consent Mode v2 bootstrap. Emits a STATIC inline <script> in the
 * document head that sets all four signals to `denied` by default
 * (GDPR-safe) before any analytics tag. The ConsentProvider fires
 * `gtag('consent','update', …)` on accept.
 *
 * This runs before any analytics tag so consent is provably default-denied
 * (WEB-PRODUCTION.md §11). The GA4 tag itself (components/analytics/Ga4Script.tsx)
 * loads only after the Analytics category is granted; it relies on the
 * `window.gtag` / `dataLayer` this snippet bootstraps.
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
