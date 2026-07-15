import type {
  AttributionClickIds,
  AttributionDevice,
  AttributionSnapshot,
  AttributionState,
  AttributionSubmission,
  AttributionTouch,
  AttributionUtm,
} from "./types";

/** Field-length caps mirror the CMS Zod schema so a submit never 400s on size. */
const UTM_MAX = 256;
const URL_MAX = 2048;
const CLICK_ID_MAX = 512;

const truncate = (value: string, max: number): string =>
  value.length > max ? value.slice(0, max) : value;

const readParam = (params: URLSearchParams, key: string, max: number): string | undefined => {
  const raw = params.get(key);
  if (raw == null) return undefined;
  const trimmed = raw.trim();
  return trimmed.length === 0 ? undefined : truncate(trimmed, max);
};

/**
 * Drop `undefined` values so we never send empty keys across the boundary.
 * The return type strips `undefined` from each value so results compose under
 * `exactOptionalPropertyTypes` (a present `key: undefined` would otherwise fail).
 */
const compact = <T extends object>(obj: T): { [K in keyof T]?: Exclude<T[K], undefined> } => {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) out[key] = value;
  }
  return out as { [K in keyof T]?: Exclude<T[K], undefined> };
};

const isEmpty = (obj: object): boolean =>
  Object.values(obj as Record<string, unknown>).every((v) => v === undefined);

export const parseUtm = (params: URLSearchParams): AttributionUtm =>
  compact({
    source: readParam(params, "utm_source", UTM_MAX),
    medium: readParam(params, "utm_medium", UTM_MAX),
    campaign: readParam(params, "utm_campaign", UTM_MAX),
    term: readParam(params, "utm_term", UTM_MAX),
    content: readParam(params, "utm_content", UTM_MAX),
  });

export const parseClickIds = (params: URLSearchParams): AttributionClickIds =>
  compact({
    gclid: readParam(params, "gclid", CLICK_ID_MAX),
    fbclid: readParam(params, "fbclid", CLICK_ID_MAX),
    liFatId: readParam(params, "li_fat_id", CLICK_ID_MAX),
  });

/** True when the current URL carries any campaign signal worth recording as a touch. */
export const hasCampaignSignal = (utm: AttributionUtm, clickIds: AttributionClickIds): boolean =>
  !isEmpty(utm) || !isEmpty(clickIds);

/**
 * Classify a device from the user-agent string. Deterministic and pure so it
 * can be unit-tested; the provider passes `navigator.userAgent`.
 */
export const detectDevice = (userAgent: string): AttributionDevice => {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|(android(?!.*mobile))|kindle|playbook|silk/.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android.*mobile|windows phone|blackberry/.test(ua)) return "mobile";
  return "desktop";
};

/** External referrer only — same-origin referrers are internal navigations, not acquisition. */
const externalReferrer = (referrer: string, currentOrigin: string): string | undefined => {
  const raw = referrer.trim();
  if (raw.length === 0) return undefined;
  try {
    if (new URL(raw).origin === currentOrigin) return undefined;
  } catch {
    return undefined;
  }
  return truncate(raw, URL_MAX);
};

export interface BuildSnapshotInput {
  href: string;
  search: string;
  origin: string;
  referrer: string;
  userAgent: string;
  /** ISO timestamp — injected so the function stays pure/testable. */
  at: string;
}

/** Build the in-memory snapshot for the current page load. */
export const buildSnapshot = (input: BuildSnapshotInput): AttributionSnapshot => {
  const params = new URLSearchParams(input.search);
  const utm = parseUtm(params);
  const clickIds = parseClickIds(params);
  const touch: AttributionTouch = {
    ...utm,
    landingPage: truncate(input.href, URL_MAX),
    ...compact({ referrer: externalReferrer(input.referrer, input.origin) }),
    at: input.at,
  };
  return { touch, clickIds, device: detectDevice(input.userAgent) };
};

const utmOf = (touch: AttributionTouch): AttributionUtm =>
  compact({
    source: touch.source,
    medium: touch.medium,
    campaign: touch.campaign,
    term: touch.term,
    content: touch.content,
  });

const mergeClickIds = (
  primary: AttributionClickIds,
  fallback: AttributionClickIds,
): AttributionClickIds =>
  compact({
    gclid: primary.gclid ?? fallback.gclid,
    fbclid: primary.fbclid ?? fallback.fbclid,
    liFatId: primary.liFatId ?? fallback.liFatId,
  });

/**
 * Compose the POST fragment for a submission. When a persisted state exists
 * (consent granted), first/last touch come from it; otherwise the current
 * page snapshot stands in for both — so an un-consented single-session
 * submit still carries correct last-touch UTMs.
 */
export const composeSubmission = (
  state: AttributionState | null,
  snapshot: AttributionSnapshot,
): AttributionSubmission => {
  const first = state?.first ?? snapshot.touch;
  const last = state?.last ?? snapshot.touch;
  const clickIds = mergeClickIds(state?.clickIds ?? {}, snapshot.clickIds);

  const utm = utmOf(last);
  const firstTouchEmpty = isEmpty(utmOf(first)) && !first.referrer;

  const attribution = compact({
    device: snapshot.device,
    gclid: clickIds.gclid,
    fbclid: clickIds.fbclid,
    liFatId: clickIds.liFatId,
    firstTouch: firstTouchEmpty ? undefined : first,
  });

  return compact({
    utm: isEmpty(utm) ? undefined : utm,
    attribution: isEmpty(attribution) ? undefined : attribution,
  });
};

/**
 * Fold the current snapshot into the persisted state: first touch is
 * write-once; last touch advances only on a fresh campaign signal; click IDs
 * accumulate. Returns the next state to persist.
 */
export const advanceState = (
  prev: AttributionState | null,
  snapshot: AttributionSnapshot,
): AttributionState => {
  if (prev == null) {
    return { first: snapshot.touch, last: snapshot.touch, clickIds: snapshot.clickIds };
  }
  const fresh = hasCampaignSignal(utmOf(snapshot.touch), snapshot.clickIds);
  return {
    first: prev.first,
    last: fresh ? snapshot.touch : prev.last,
    clickIds: mergeClickIds(snapshot.clickIds, prev.clickIds),
  };
};
