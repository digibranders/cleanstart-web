/**
 * Compose the `<meta name="robots">` content string from the editor's
 * SEO group. Output is a comma-separated list of directives Google /
 * Bing both honour:
 *
 *   index|noindex, follow|nofollow,
 *   [noarchive], [nosnippet], [noimageindex], [notranslate],
 *   [max-snippet:N], [max-image-preview:none|standard|large],
 *   [max-video-preview:N], [unavailable_after:YYYY-MM-DD]
 *
 * Pure: no env, no fetch. Caller is the consumer that emits
 * `<meta name="robots" content="...">` (apps/web, when it lands).
 *
 * Why a single composition helper instead of per-field meta tags:
 *   Google's robots-meta contract expects a single comma-list. Multiple
 *   `<meta name="robots">` tags get merged but the spec recommends one.
 *   One source of truth here keeps the consumer trivial.
 */

export type IndexableValue = 'index' | 'noindex' | 'noindex,nofollow';

export interface RobotsAdvanced {
  /** Don't show a cached version in SERP. */
  readonly noarchive?: boolean | null;
  /** Suppress textual snippet entirely (overrides max-snippet). */
  readonly nosnippet?: boolean | null;
  /** Don't index images on this page. */
  readonly noimageindex?: boolean | null;
  /** Don't show "Translate" link on this page. */
  readonly notranslate?: boolean | null;
  /**
   * Max characters Google may show as a text snippet.
   *  -1 = no limit (default), 0 = suppress the snippet, N = at most N chars.
   */
  readonly maxSnippet?: number | null;
  /**
   * Max image-preview size Google may show.
   *  'none' = no image, 'standard' = default, 'large' = up to 1200px wide.
   *
   * Setting `'large'` is a strong nudge for Discover / News-tab eligibility
   * on photo-heavy posts.
   */
  readonly maxImagePreview?: 'none' | 'standard' | 'large' | null;
  /**
   * Max video-preview seconds Google may show.
   *  -1 = no limit, 0 = suppress, N = at most N seconds.
   */
  readonly maxVideoPreview?: number | null;
  /**
   * RFC 850 / ISO 8601 date after which the page should drop out of
   * the index. Useful for time-bound campaigns / event landing pages.
   */
  readonly unavailableAfter?: string | null;
}

export interface RobotsMetaInput {
  readonly indexable?: IndexableValue | null;
  readonly advanced?: RobotsAdvanced | null;
  /**
   * Payload's `_status` field on the doc. When anything other than
   * `'published'` (i.e. `'draft'` or unset), the composer returns
   * `'noindex, nofollow'` immediately, ignoring every other input.
   *
   * This is the safety net against accidentally indexing drafts —
   * editors can't override it from the admin UI.
   */
  readonly status?: 'published' | 'draft' | string | null;
}

const indexFollowPair = (indexable: IndexableValue | null | undefined): string => {
  switch (indexable) {
    case 'noindex':
      return 'noindex, follow';
    case 'noindex,nofollow':
      return 'noindex, nofollow';
    default:
      return 'index, follow';
  }
};

const formatUnavailableAfter = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  // Accept ISO 8601 (`2026-12-31` or `2026-12-31T23:59:59Z`); pass-through
  // anything that parses as a Date and emit RFC 850 as Google docs require.
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return `unavailable_after: ${d.toISOString()}`;
};

const formatMaxNum = (
  name: 'max-snippet' | 'max-video-preview',
  value: number | null | undefined,
): string | null => {
  if (value == null) return null;
  if (!Number.isFinite(value)) return null;
  // -1 means "no limit" — that's the default in Google's own docs, and
  // emitting it is harmless. We DO emit it explicitly when the editor
  // sets it because it overrides any conflicting site-wide directive.
  return `${name}:${Math.trunc(value)}`;
};

/**
 * Compose the robots meta content string. Empty advanced + default
 * indexable returns `'index, follow'`.
 *
 * Hard rule: when `input.status` is anything other than `'published'`,
 * the result is always `'noindex, nofollow'` — protects drafts and
 * scheduled docs from accidental indexing regardless of card state.
 */
export const composeRobotsMeta = (input: RobotsMetaInput): string => {
  if (input.status !== undefined && input.status !== null && input.status !== 'published') {
    return 'noindex, nofollow';
  }

  const directives: string[] = [];
  directives.push(indexFollowPair(input.indexable ?? null));

  const a = input.advanced ?? {};
  if (a.noarchive) directives.push('noarchive');
  if (a.nosnippet) directives.push('nosnippet');
  if (a.noimageindex) directives.push('noimageindex');
  if (a.notranslate) directives.push('notranslate');

  const maxSnippet = formatMaxNum('max-snippet', a.maxSnippet);
  if (maxSnippet) directives.push(maxSnippet);

  if (a.maxImagePreview && a.maxImagePreview !== 'standard') {
    // 'standard' is the default — emitting it is noise. 'none' / 'large'
    // are the meaningful overrides.
    directives.push(`max-image-preview:${a.maxImagePreview}`);
  }

  const maxVideo = formatMaxNum('max-video-preview', a.maxVideoPreview);
  if (maxVideo) directives.push(maxVideo);

  const unavailable = formatUnavailableAfter(a.unavailableAfter ?? null);
  if (unavailable) directives.push(unavailable);

  return directives.join(', ');
};
