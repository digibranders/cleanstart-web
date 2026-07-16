/**
 * Typed GA4 custom-event emitter.
 *
 * Fires `gtag('event', …)` against the tag loaded by <Ga4Script/>. Under Advanced
 * Consent Mode v2 the tag itself gates *storage* on consent (denied → cookieless,
 * modeled hits; granted → full hits), so events are emitted unconditionally —
 * caller code never needs to read consent state. Safe on the server (no-ops) and
 * safe when GA4 is not loaded (staging/preview, or before hydration): the call
 * short-circuits when `window.gtag` is absent.
 *
 * Use only for meaningful conversions/interactions. Automatic + enhanced-
 * measurement events (page_view, scroll, outbound click, site search) are already
 * captured by GA4 — do NOT re-emit them here.
 */
type GtagFn = (
  command: "event",
  eventName: string,
  params?: Record<string, unknown>,
) => void;

/**
 * Events we emit. GA4 recommended names are used where one exists
 * (`generate_lead`, `file_download`); the rest are custom snake_case names.
 */
export type Ga4EventName =
  | "generate_lead"
  | "file_download"
  | "deal_registration"
  | "cta_click";

/** Flat, primitive-valued params (GA4 rejects nested objects/arrays). */
export type Ga4EventParams = Record<string, string | number | boolean | undefined>;

export function trackEvent(name: Ga4EventName, params?: Ga4EventParams): void {
  if (typeof window === "undefined") return;
  const gtag = (window as Window & { gtag?: GtagFn }).gtag;
  if (typeof gtag !== "function") return;
  gtag("event", name, params);
}
