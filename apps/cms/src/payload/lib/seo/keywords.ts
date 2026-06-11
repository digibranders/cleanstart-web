/**
 * Topic-keyword normalization shared by the SEO sidebar editor, the
 * JSON-LD dispatcher, and the Meilisearch document builder.
 *
 * Keywords are an entity / structured-data signal (schema.org
 * `keywords` + `mentions[]`) and a search facet — NOT a
 * `<meta name="keywords">` tag (dead for ranking since 2009).
 */

/** Max keywords stored per document. Beyond this is stuffing, not signal. */
export const MAX_KEYWORDS = 20;
/** Max characters per keyword. A "keyword" longer than this is a sentence. */
export const MAX_KEYWORD_LEN = 60;

/**
 * Normalize an arbitrary stored value into a clean `string[]`:
 * trims, drops empties / non-strings, dedupes case-insensitively
 * (first-seen casing wins), caps each entry length and the total count.
 * Always returns a fresh array — never null — so callers decide how to
 * persist "empty".
 */
export const normalizeKeywords = (input: unknown): string[] => {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    if (typeof raw !== 'string') continue;
    const trimmed = raw.trim().slice(0, MAX_KEYWORD_LEN);
    if (trimmed.length === 0) continue;
    const key = trimmed.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
    if (out.length >= MAX_KEYWORDS) break;
  }
  return out;
};

/**
 * Merge the canonical `seo.keywords` source with a legacy fallback
 * (guides' original `keywords[]` array, already flattened to strings).
 * Primary order is preserved; unique legacy entries are appended.
 */
export const mergeKeywordSources = (
  primary: unknown,
  legacy: readonly string[],
): string[] => normalizeKeywords([...normalizeKeywords(primary), ...legacy]);
