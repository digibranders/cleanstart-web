/**
 * Loose shape of a media upload after Payload has resolved the
 * relationship. Number IDs (depth: 0) are filtered out by callers
 * before reaching here.
 */
export interface ResolvedMedia {
  readonly url?: string | null;
  readonly width?: number | null;
  readonly height?: number | null;
  readonly alt?: string | null;
}

/**
 * Build a Schema.org ImageObject from a resolved media doc.
 * Returns null when the underlying upload has no URL.
 */
export const imageObjectFromMedia = (
  media: ResolvedMedia | null | undefined,
): Record<string, unknown> | null => {
  if (!media || !media.url) return null;
  const out: Record<string, unknown> = {
    '@type': 'ImageObject',
    url: media.url,
  };
  if (media.width) out.width = media.width;
  if (media.height) out.height = media.height;
  if (media.alt) out.caption = media.alt;
  return out;
};

/**
 * Best-effort first-of-array. Reads only objects through; a number-ID
 * (unresolved relationship) is treated as "not present" and the
 * callers fall back to no signal rather than emit a broken blob.
 */
export const pickResolved = <T extends Record<string, unknown>>(
  list: readonly (T | number | null | undefined)[] | null | undefined,
): T | null => {
  if (!list || list.length === 0) return null;
  const first = list[0];
  if (first == null) return null;
  if (typeof first === 'number') return null;
  return first;
};

/**
 * Map a list of relationship values to only the resolved (object)
 * entries. Number IDs and null/undefined are dropped silently —
 * the public-page renderer will still get a complete-but-narrower
 * blob if depth is too shallow.
 */
export const onlyResolved = <T extends Record<string, unknown>>(
  list: readonly (T | number | null | undefined)[] | null | undefined,
): T[] => {
  if (!list) return [];
  const out: T[] = [];
  for (const entry of list) {
    if (entry != null && typeof entry !== 'number') out.push(entry);
  }
  return out;
};

const DEFAULT_SPEAKABLE_SELECTORS = ['.lead', 'article p:first-of-type'] as const;

/**
 * Build the optional SpeakableSpecification block that Article
 * variants attach. Reads from `seo.speakablePath` when the editor
 * has supplied selectors; falls back to a sensible default.
 */
export const buildSpeakable = (
  selectors: readonly { selector?: string | null }[] | null | undefined,
): Record<string, unknown> => {
  const filled = (selectors ?? [])
    .map((s) => s.selector ?? '')
    .filter((s) => s.length > 0);
  return {
    '@type': 'SpeakableSpecification',
    cssSelector: filled.length > 0 ? filled : [...DEFAULT_SPEAKABLE_SELECTORS],
  };
};
