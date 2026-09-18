import { buildGtmSnippet } from "@/lib/analytics/gtm-snippet";
import { gtmContainerId } from "@/lib/analytics/gtm";

/**
 * Server-rendered Google Tag Manager bootstrap, emitted in the document `<head>`
 * immediately after the Consent Mode default.
 *
 * A Server Component on purpose: the snippet is baked into the static HTML, so
 * the container is visible in view-source, is detectable by Tag Assistant, and
 * starts loading during head parse instead of after React hydration.
 *
 * Renders nothing when `NEXT_PUBLIC_GTM_ID` is unset or malformed. The preview
 * host exclusion is handled at runtime inside the snippet, since a statically
 * prerendered layout cannot know the request host.
 *
 * There is no `<noscript>` iframe: it only serves tags to visitors without
 * JavaScript, which none of our tags support, and it would need a `frame-src`
 * entry in the CSP.
 */
export function GtmHeadScript() {
  const containerId = gtmContainerId();
  if (!containerId) return null;

  return (
    <script
      id="gtm-bootstrap"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: build-time snippet from a validated ^GTM-[A-Z0-9]+$ id (no user input); cleared by script-src 'unsafe-inline' in csp.ts.
      dangerouslySetInnerHTML={{ __html: buildGtmSnippet(containerId) }}
    />
  );
}
