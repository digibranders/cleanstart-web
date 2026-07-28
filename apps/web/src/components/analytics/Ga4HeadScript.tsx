import { buildGa4Snippet } from "@/lib/analytics/ga4-snippet";
import { ga4MeasurementId } from "@/lib/analytics/ga4";

/**
 * Server-rendered GA4 bootstrap, emitted in the document `<head>` immediately
 * after the Consent Mode default.
 *
 * This is a Server Component on purpose: the snippet is baked into the static
 * HTML, so the tag is visible in view-source, is detectable by Tag Assistant and
 * third-party SEO scanners, and begins loading during head parse instead of
 * after React hydration. See lib/analytics/ga4-snippet.ts for the host-gating
 * and ordering rationale.
 *
 * Renders nothing when `NEXT_PUBLIC_GA4_ID` is unset or malformed (local dev,
 * and any deploy that hasn't been given the id) — fail-safe: no tag rather than
 * a broken loader. The staging/preview exclusion is handled at runtime inside
 * the snippet, since a statically prerendered layout cannot know the host.
 */
export function Ga4HeadScript() {
  const measurementId = ga4MeasurementId();
  if (!measurementId) return null;

  return (
    <script
      id="ga4-bootstrap"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: build-time snippet from a validated ^G-[A-Z0-9]+$ id (no user input); cleared by script-src 'unsafe-inline' in csp.ts.
      dangerouslySetInnerHTML={{ __html: buildGa4Snippet(measurementId) }}
    />
  );
}
