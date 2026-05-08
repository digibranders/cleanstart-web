/**
 * Webflow Webinars stored TWO region fields:
 *   - `Region` — free-text plain string
 *   - `Region List` — option (Americas / EMEA / APAC / Global)
 *
 * Payload's Webinars collection has a single `region` enum. The
 * migration prefers `Region List` as canonical; falls back to a
 * normalized form of `Region` only when Region List is empty.
 */

export type WebinarRegionEnum = 'Americas' | 'EMEA' | 'APAC' | 'Global';

const FREE_TEXT_MAP: Record<string, WebinarRegionEnum> = {
  americas: 'Americas',
  america: 'Americas',
  us: 'Americas',
  usa: 'Americas',
  'north-america': 'Americas',
  na: 'Americas',
  emea: 'EMEA',
  europe: 'EMEA',
  eu: 'EMEA',
  uk: 'EMEA',
  apac: 'APAC',
  asia: 'APAC',
  'asia-pacific': 'APAC',
  india: 'APAC',
  global: 'Global',
  worldwide: 'Global',
  international: 'Global',
};

const validEnum = (value: unknown): WebinarRegionEnum | null => {
  if (value === 'Americas' || value === 'EMEA' || value === 'APAC' || value === 'Global') {
    return value;
  }
  return null;
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
