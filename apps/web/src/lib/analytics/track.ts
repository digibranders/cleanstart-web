/**
 * Typed dataLayer event emitter.
 *
 * Pushes GTM custom events, which the container maps onto GA4 event tags (see
 * docs/web/TRACKING-TAGS.md). GA4 measurement is un-gated (analytics_storage is
 * granted by default outside the EEA/UK/CH, see
 * lib/consent/consent-mode-snippet.ts), so events are pushed unconditionally and
 * caller code never needs to read consent state. Safe on the server (no-ops) and
 * safe before the container finishes loading: the head consent snippet creates
 * `window.dataLayer`, and GTM replays whatever is already queued when it boots.
 *
 * Use only for meaningful conversions/interactions. Automatic + enhanced-
 * measurement events (scroll, outbound click) are already captured by GA4, so do
 * NOT re-emit them here. Two exceptions are deliberately manual because
 * enhanced measurement cannot see them on this site:
 *  - `page_view` on SPA route changes (<Ga4RouteTracker/>): the property's
 *    "history events" toggle must stay OFF or navigations double-count.
 *  - `search`: the ⌘K palette / typeahead never put `?q=` in the URL, so GA4's
 *    site-search detection never fires.
 */

/**
 * Events we emit. GA4 recommended names are used where one exists
 * (`generate_lead`, `file_download`, `search`); the rest are custom
 * snake_case names. Each needs a matching Custom Event trigger and GA4 event
 * tag in the GTM container.
 */
export type Ga4EventName =
  | "generate_lead"
  | "file_download"
  | "deal_registration"
  // Deliberately not `generate_lead`: a candidate is not a sales lead, and
  // folding ~1,500 applications a year into the lead count would make that
  // metric useless.
  | "job_application"
  // Same reasoning: a subscriber is audience, not pipeline.
  | "newsletter_signup"
  // Fired once per confirmed conversion from /thank-you/[type]. NOT a
  // substitute for generate_lead: the gap between the two measures whether
  // the redirect is working.
  | "thank_you_view"
  | "cta_click"
  | "search";

/**
 * Every parameter key any event may carry.
 *
 * GTM data layer variables persist once set, so a key left over from an earlier
 * push would silently attach itself to a later, unrelated event. Each emit
 * therefore nulls the whole set first. Params are typed against this list, so a
 * new key at a call site fails typecheck until it is added here, and it also
 * needs a Data Layer Variable in GTM before GA4 will receive it.
 */
const EVENT_PARAM_KEYS = [
  "form_name",
  "gated",
  "job_slug",
  "marketing_opt_in",
  "search_term",
  "search_results",
  "search_scope",
  "resource_slug",
  "resource_title",
  "cta",
  "page",
  "video_id",
  "page_location",
  "page_title",
  "page_referrer",
] as const;

type EventParamKey = (typeof EVENT_PARAM_KEYS)[number];

/** Flat, primitive-valued params (GA4 rejects nested objects/arrays). */
export type Ga4EventParams = Partial<
  Record<EventParamKey, string | number | boolean | undefined>
>;

type DataLayer = Array<Record<string, unknown>>;

function emit(name: string, params?: Ga4EventParams): void {
  if (typeof window === "undefined") return;
  const dataLayer = (window as Window & { dataLayer?: DataLayer }).dataLayer;
  if (!Array.isArray(dataLayer)) return;

  const reset: Record<string, null> = {};
  for (const key of EVENT_PARAM_KEYS) reset[key] = null;
  dataLayer.push(reset);

  const payload: Record<string, unknown> = { event: name };
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined) payload[key] = value;
  }
  dataLayer.push(payload);
}

export function trackEvent(name: Ga4EventName, params?: Ga4EventParams): void {
  emit(name, params);
}

/**
 * Manual `page_view` for client-side route changes. The hard load's page_view
 * comes from the GTM Google tag firing on Initialization; <Ga4RouteTracker/>
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
