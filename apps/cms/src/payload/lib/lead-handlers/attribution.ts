/**
 * Marketing-attribution model shared across the LeadHandler boundary.
 *
 * Two touches are recorded per lead:
 *  - **last touch** — the UTMs on the URL at submit time, stored in the
 *    existing `leads.utm` group (unchanged; keeps CSV + HubSpot relay working).
 *  - **first touch** — the campaign that originally sourced the visitor,
 *    persisted client-side (~90 days) and sent once they convert. Lives in
 *    `leads.attribution.firstTouch`.
 *
 * `channel` is always derived **server-side** from the last-touch UTMs, the
 * ad click IDs, and the first-touch referrer — the client-sent value (if any)
 * is treated as an untrusted hint and overwritten. This keeps the marketing
 * dashboard's grouping deterministic and un-spoofable.
 */

export const LEAD_CHANNELS = [
  'paid_search',
  'paid_social',
  'organic_search',
  'social',
  'email',
  'referral',
  'direct',
  'other',
] as const;

export type LeadChannel = (typeof LEAD_CHANNELS)[number];

export const LEAD_DEVICES = ['desktop', 'mobile', 'tablet'] as const;
export type LeadDevice = (typeof LEAD_DEVICES)[number];

export type AttributionUtm = {
  source?: string | undefined;
  medium?: string | undefined;
  campaign?: string | undefined;
  term?: string | undefined;
  content?: string | undefined;
};

export type AttributionFirstTouch = AttributionUtm & {
  landingPage?: string | undefined;
  referrer?: string | undefined;
  /** ISO-8601 timestamp of the visitor's first session. */
  at?: string | undefined;
};

export type LeadAttribution = {
  channel?: LeadChannel | undefined;
  device?: LeadDevice | undefined;
  gclid?: string | undefined;
  fbclid?: string | undefined;
  liFatId?: string | undefined;
  firstTouch?: AttributionFirstTouch | undefined;
};

/** Select options for the `channel` field on the Leads collection. */
export const LEAD_CHANNEL_OPTIONS: { label: string; value: LeadChannel }[] = [
  { label: 'Paid Search', value: 'paid_search' },
  { label: 'Paid Social', value: 'paid_social' },
  { label: 'Organic Search', value: 'organic_search' },
  { label: 'Social', value: 'social' },
  { label: 'Email', value: 'email' },
  { label: 'Referral', value: 'referral' },
  { label: 'Direct', value: 'direct' },
  { label: 'Other', value: 'other' },
];

export const LEAD_DEVICE_OPTIONS: { label: string; value: LeadDevice }[] = [
  { label: 'Desktop', value: 'desktop' },
  { label: 'Mobile', value: 'mobile' },
  { label: 'Tablet', value: 'tablet' },
];

const normalise = (value: string | undefined | null): string =>
  (value ?? '').trim().toLowerCase();

const PAID_SEARCH_MEDIUMS = new Set(['cpc', 'ppc', 'paidsearch', 'paid-search', 'paid_search', 'sem']);
const PAID_SOCIAL_MEDIUMS = new Set(['paidsocial', 'paid-social', 'paid_social', 'cpm', 'display']);
const ORGANIC_MEDIUMS = new Set(['organic', 'organic-search', 'organic_search']);
const SOCIAL_MEDIUMS = new Set(['social', 'social-organic', 'sm']);
const EMAIL_MEDIUMS = new Set(['email', 'e-mail', 'newsletter', 'mail']);
const REFERRAL_MEDIUMS = new Set(['referral', 'link']);

const SOCIAL_HOST_FRAGMENTS = [
  'facebook.',
  'fb.',
  'instagram.',
  'linkedin.',
  'lnkd.in',
  't.co',
  'twitter.',
  'x.com',
  'youtube.',
  'youtu.be',
  'reddit.',
  'pinterest.',
  'tiktok.',
];
const SEARCH_HOST_FRAGMENTS = ['google.', 'bing.', 'duckduckgo.', 'yahoo.', 'ecosia.', 'baidu.', 'yandex.'];
const EMAIL_HOST_FRAGMENTS = ['mail.', 'outlook.', 'webmail.', 'proton.me'];

// Bare engine / network names for matching a `utm_source` value, which is
// hand-typed (`google`, `linkedin`) rather than a full hostname.
const SEARCH_SOURCE_NAMES = ['google', 'bing', 'duckduckgo', 'yahoo', 'ecosia', 'baidu', 'yandex'];
const SOCIAL_SOURCE_NAMES = [
  'facebook',
  'instagram',
  'linkedin',
  'twitter',
  'youtube',
  'reddit',
  'pinterest',
  'tiktok',
];

const hostFromReferrer = (referrer: string | undefined): string => {
  const raw = (referrer ?? '').trim();
  if (raw.length === 0) return '';
  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    return '';
  }
};

const matchesAny = (host: string, fragments: string[]): boolean =>
  fragments.some((fragment) => host.includes(fragment));

export type DeriveChannelInput = {
  utm?: AttributionUtm | undefined;
  referrer?: string | undefined;
  gclid?: string | undefined;
  fbclid?: string | undefined;
  liFatId?: string | undefined;
};

/**
 * Classify a lead into a marketing channel from its last-touch signals.
 * Precedence: explicit paid click IDs → UTM medium → UTM source → referrer
 * host → direct. Deterministic and side-effect-free so the dashboard can
 * group leads consistently across the report and the CSV export.
 */
export function deriveChannel(input: DeriveChannelInput): LeadChannel {
  if (normalise(input.gclid).length > 0) return 'paid_search';
  if (normalise(input.fbclid).length > 0 || normalise(input.liFatId).length > 0) {
    return 'paid_social';
  }

  const medium = normalise(input.utm?.medium);
  if (medium.length > 0) {
    if (PAID_SEARCH_MEDIUMS.has(medium)) return 'paid_search';
    if (PAID_SOCIAL_MEDIUMS.has(medium)) return 'paid_social';
    if (EMAIL_MEDIUMS.has(medium)) return 'email';
    if (ORGANIC_MEDIUMS.has(medium)) return 'organic_search';
    if (SOCIAL_MEDIUMS.has(medium)) return 'social';
    if (REFERRAL_MEDIUMS.has(medium)) return 'referral';
  }

  const source = normalise(input.utm?.source);
  if (source.length > 0) {
    if (matchesAny(source, SEARCH_SOURCE_NAMES)) return 'organic_search';
    if (matchesAny(source, SOCIAL_SOURCE_NAMES)) return 'social';
    if (matchesAny(source, ['newsletter', 'email'])) return 'email';
    // A source with no medium classification is still a tagged campaign.
    return 'referral';
  }

  // Email hosts are checked before search hosts so webmail (mail.google.com)
  // is not mis-bucketed as organic search by the shared `google.` fragment.
  const host = hostFromReferrer(input.referrer);
  if (host.length > 0) {
    if (matchesAny(host, EMAIL_HOST_FRAGMENTS)) return 'email';
    if (matchesAny(host, SEARCH_HOST_FRAGMENTS)) return 'organic_search';
    if (matchesAny(host, SOCIAL_HOST_FRAGMENTS)) return 'social';
    return 'referral';
  }

  return 'direct';
}
