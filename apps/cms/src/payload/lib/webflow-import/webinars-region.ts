/**
 * Webflow Webinars stored TWO region fields:
 *   - `Region` — free-text plain string
 *   - `Region List` — option (Americas / EMEA / APAC / Global)
 *
 * Payload's Webinars collection has a single `region` enum. The
 * migration prefers `Region List` as canonical; falls back to a
 * normalized form of `Region` only when Region List is empty.
 */

export type WebinarRegionEnum = 'north-america' | 'asia-mea' | 'emea' | 'global';

const FREE_TEXT_MAP: Record<string, WebinarRegionEnum> = {
  americas: 'north-america',
  america: 'north-america',
  us: 'north-america',
  usa: 'north-america',
  'north-america': 'north-america',
  na: 'north-america',
  emea: 'emea',
  europe: 'emea',
  eu: 'emea',
  uk: 'emea',
  apac: 'asia-mea',
  asia: 'asia-mea',
  'asia-pacific': 'asia-mea',
  'asia-mea': 'asia-mea',
  india: 'asia-mea',
  mea: 'asia-mea',
  global: 'global',
  worldwide: 'global',
  international: 'global',
};

const LEGACY_TO_NEW: Record<string, WebinarRegionEnum> = {
  Americas: 'north-america',
  EMEA: 'emea',
  APAC: 'asia-mea',
  Global: 'global',
};

const validEnum = (value: unknown): WebinarRegionEnum | null => {
  if (typeof value !== 'string') return null;
  if (value === 'north-america' || value === 'asia-mea' || value === 'emea' || value === 'global') {
    return value;
  }
  return LEGACY_TO_NEW[value] ?? null;
};

const fromFreeText = (raw: unknown): WebinarRegionEnum | null => {
  if (typeof raw !== 'string') return null;
  const key = raw.trim().toLowerCase().replace(/[\s_]+/g, '-');
  if (key.length === 0) return null;
  return FREE_TEXT_MAP[key] ?? null;
};

/**
 * Pick the canonical region for a Webflow webinar row. `regionList`
 * (the option field) wins when set; falls back to a normalized
 * `region` (the free-text field). Returns null when neither maps —
 * caller treats null as "needs editor pass" and defaults to Global
 * for safety.
 */
export const resolveWebinarRegion = (args: {
  regionList?: unknown;
  region?: unknown;
}): WebinarRegionEnum | null => {
  const fromList = validEnum(args.regionList);
  if (fromList) return fromList;
  return fromFreeText(args.region);
};
