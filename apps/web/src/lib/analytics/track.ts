/**
 * Typed GA4 custom-event emitter.
 *
 * Fires `gtag('event', …)` against the tag loaded by <Ga4HeadScript/>. GA4
 * measurement is un-gated (analytics_storage is granted by default — see
 * lib/consent/consent-mode-snippet.ts), so events are emitted unconditionally —
 * caller code never needs to read consent state. Safe on the server (no-ops) and
 * safe before gtag.js finishes loading: the head consent snippet defines the
 * `window.gtag` queue stub, so early events are queued and replayed, and the
 * call short-circuits entirely where the snippet is absent.
 *
 * Use only for meaningful conversions/interactions. Automatic + enhanced-
 * measurement events (scroll, outbound click) are already captured by GA4 — do
 * NOT re-emit them here. Two exceptions are deliberately manual because
 * enhanced measurement cannot see them on this site:
 *  - `page_view` on SPA route changes (<Ga4RouteTracker/>): the property's
 *    "history events" toggle must stay OFF or navigations double-count.
 *  - `search`: the ⌘K palette / typeahead never put `?q=` in the URL, so GA4's
 *    site-search detection never fires.
 */
type GtagFn = (
  command: "event",
  eventName: string,
  params?: Record<string, unknown>,
) => void;

/**
 * Events we emit. GA4 recommended names are used where one exists
 * (`generate_lead`, `file_download`, `search`); the rest are custom
 * snake_case names.
 */
export type Ga4EventName =
  | "generate_lead"
  | "file_download"
  | "deal_registration"
  | "cta_click"
  | "search";

/** Flat, primitive-valued params (GA4 rejects nested objects/arrays). */
export type Ga4EventParams = Record<string, string | number | boolean | undefined>;

function emit(name: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const gtag = (window as Window & { gtag?: GtagFn }).gtag;
  if (typeof gtag !== "function") return;
  gtag("event", name, params);
}

export function trackEvent(name: Ga4EventName, params?: Ga4EventParams): void {
  emit(name, params);
}

/**
 * Manual `page_view` for client-side route changes. The initial page load's
 * page_view comes from `gtag('config', …)` in <Ga4HeadScript/>; <Ga4RouteTracker/>
 * calls this for every subsequent soft navigation with the post-commit
 * document.title (GA4's own history tracking reads the PREVIOUS page's title).
 */
export function trackPageView(params: {
  page_location: string;
  page_title: string;
  page_referrer?: string;
}): void {
  emit("page_view", params);
}
