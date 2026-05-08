/**
 * Keyword-target density scorer. Surfaces three signals editors care
 * about when targeting a specific phrase:
 *
 *   1. Body density — exact-phrase + stemmed match counts as a % of
 *      total words. 1.0–2.5% is the conventional sweet spot; below
 *      reads as light, above reads as keyword-stuffed.
 *   2. Title presence — exact phrase or stem-match in `seo.title`.
 *   3. Description presence — same in `seo.description`.
 *
 * Stemming is intentionally light (lowercase + trailing-s/ing/ed
 * trimming) — full Porter / Snowball would over-match.
 */

const STOP_TRAIL = /(?:s|es|ies|ing|ed)$/;

const tokenize = (raw: string): string[] => {
  if (typeof raw !== 'string') return [];
  return raw
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);
};

const stem = (word: string): string => {
  if (word.length <= 4) return word;
  return word.replace(STOP_TRAIL, '');
};

const stemTokens = (tokens: readonly string[]): string[] => tokens.map(stem);

const countPhrase = (haystackTokens: string[], needle: string): number => {
  const needleTokens = stemTokens(tokenize(needle));
  if (needleTokens.length === 0) return 0;
  if (needleTokens.length === 1) {
    const single = needleTokens[0];
    if (!single) return 0;
    let count = 0;
    for (const t of haystackTokens) if (t === single) count += 1;
    return count;
  }
  // Multi-word phrase — sliding window over the stemmed haystack.
  let count = 0;
  for (let i = 0; i <= haystackTokens.length - needleTokens.length; i += 1) {
    let match = true;
    for (let j = 0; j < needleTokens.length; j += 1) {
      if (haystackTokens[i + j] !== needleTokens[j]) {
        match = false;
        break;
      }
    }
    if (match) count += 1;
  }
  return count;
};

export type DensityBand = 'absent' | 'light' | 'good' | 'overused';

export interface KeywordDensityResult {
  readonly keyword: string;
  readonly bodyOccurrences: number;
  readonly bodyWords: number;
  /** Percentage 0–100, two-decimal precision. */
  readonly bodyDensity: number;
  readonly titleOccurrences: number;
  readonly descriptionOccurrences: number;
  readonly band: DensityBand;
}

const bandFor = (occurrences: number, density: number): DensityBand => {
  if (occurrences === 0) return 'absent';
  if (density < 1.0) return 'light';
  if (density <= 2.5) return 'good';
  return 'overused';
};

/**
 * Run the scorer for a single target keyword across the doc's body
 * plain text + SEO title + SEO description.
 */
export const scoreKeywordDensity = (args: {
  readonly keyword: string;
  readonly bodyText: string;
  readonly title?: string | null;
  readonly description?: string | null;
}): KeywordDensityResult => {
  const trimmed = args.keyword.trim();
  if (trimmed.length === 0) {
    return {
      keyword: trimmed,
      bodyOccurrences: 0,
      bodyWords: 0,
      bodyDensity: 0,
      titleOccurrences: 0,
      descriptionOccurrences: 0,
      band: 'absent',
    };
  }

  const bodyTokensRaw = tokenize(args.bodyText);
  const bodyTokens = stemTokens(bodyTokensRaw);
  const bodyOccurrences = countPhrase(bodyTokens, trimmed);
  const bodyDensity =
    bodyTokens.length === 0
      ? 0
      : Math.round((bodyOccurrences / bodyTokens.length) * 10000) / 100;
  const titleOccurrences = countPhrase(stemTokens(tokenize(args.title ?? '')), trimmed);
  const descriptionOccurrences = countPhrase(
    stemTokens(tokenize(args.description ?? '')),
    trimmed,
  );

  return {
    keyword: trimmed,
    bodyOccurrences,
    bodyWords: bodyTokens.length,
    bodyDensity,
    titleOccurrences,
    descriptionOccurrences,
    band: bandFor(bodyOccurrences, bodyDensity),
  };
};
