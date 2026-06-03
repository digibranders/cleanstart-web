import Script from "next/script";

/**
 * GA4 Consent Mode v2 bootstrap. Renders BEFORE any analytics tag and
 * sets all four signals to `denied` by default (GDPR-safe). The
 * ConsentProvider fires `gtag('consent','update', …)` on accept.
 *
 * No GA4 script ships yet — this is the scaffold so GA4 is plug-and-play
 * and consent is provably default-denied (WEB-PRODUCTION.md §11).
 *
 * `nonce` is the per-request CSP nonce from proxy.ts (x-nonce header),
 * required because inline scripts are otherwise blocked by the CSP.
 */
export function ConsentModeScript({ nonce }: { nonce?: string }) {
  return (
    <Script id="consent-mode-default" strategy="beforeInteractive" nonce={nonce}>
      {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = window.gtag || gtag;
        gtag('consent', 'default', {
          analytics_storage: 'denied',
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
          wait_for_update: 500
        });
      `}
    </Script>
  );
}
