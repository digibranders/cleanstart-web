/**
 * Reading-grade scorer. Computes the Flesch Reading Ease score from a
 * plain-text passage and buckets it into editorial bands. We use the
 * 1948 Rudolf Flesch formula because the inputs (sentence count, word
 * count, syllable count) are all derivable from a body string without
 * a dictionary or NLP dependency.
 *
 * Buckets follow Hemingway-app's editorial mapping:
 *   - 80–100: very-easy   (5th grade)
 *   - 60–79:  easy        (6th–8th grade — recommended for B2B web)
 *   - 30–59:  standard    (9th–college)
 *   - 0–29:   difficult   (college / academic)
 *
 * The syllable counter is heuristic — vowel-group counting with a
 * couple of common-suffix corrections. Good enough for the editorial
 * "is this readable?" call we're making in the sidebar; a 1–2%
 * miscount on a 1000-word post doesn't shift the band.
 */

export type ReadabilityBand = 'very-easy' | 'easy' | 'standard' | 'difficult';

export interface ReadabilityResult {
  readonly score: number;
  readonly band: ReadabilityBand;
  readonly words: number;
  readonly sentences: number;
  readonly syllables: number;
}

const SENTENCE_SPLITTER = /[.!?]+(?=\s|$)/g;
const VOWEL_GROUP = /[aeiouy]+/g;

const countSyllablesInWord = (raw: string): number => {
  const word = raw.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length === 0) return 0;
  if (word.length <= 3) return 1;

  // Trim trailing silent 'e' (but keep "le" → still one syllable in
  // "table" because the vowel-group scan already counted "a").
  const trimmed = word.endsWith('e') && !word.endsWith('le')
    ? word.slice(0, -1)
    : word;

  const matches = trimmed.match(VOWEL_GROUP);
  return matches ? Math.max(1, matches.length) : 1;
};

const countWords = (text: string): number => {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).length;
};

const countSentences = (text: string): number => {
  const matches = text.match(SENTENCE_SPLITTER);
  if (matches) return matches.length;
  // Treat any non-empty body without terminal punctuation as a single
  // sentence rather than zero — avoids div-by-zero in the formula.
  return text.trim().length === 0 ? 0 : 1;
};

const bandForScore = (score: number): ReadabilityBand => {
  if (score >= 80) return 'very-easy';
  if (score >= 60) return 'easy';
  if (score >= 30) return 'standard';
  return 'difficult';
};

/**
 * Compute the Flesch Reading Ease for a passage of plain text.
 * Returns zeros (and band 'difficult') for empty input.
 */
export const scoreReadability = (text: string): ReadabilityResult => {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return { score: 0, band: 'difficult', words: 0, sentences: 0, syllables: 0 };
  }

  const words = countWords(text);
  const sentences = countSentences(text);
  if (words === 0 || sentences === 0) {
    return { score: 0, band: 'difficult', words, sentences, syllables: 0 };
  }

  const syllables = text
    .split(/\s+/)
    .reduce((acc, w) => acc + countSyllablesInWord(w), 0);

  // Flesch Reading Ease:
  //   206.835 − 1.015·(words/sentences) − 84.6·(syllables/words)
  const raw = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  return {
    score,
    band: bandForScore(score),
    words,
    sentences,
    syllables,
  };
};
