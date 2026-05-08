/**
 * Detect featured-snippet-eligible question/answer pairs in a Lexical
 * body. Google's featured-snippet panel mostly pulls from H2/H3
 * questions followed by a 40–60-word answer paragraph (the "Hemingway
 * window"); shorter answers get cut off, longer ones lose the panel.
 *
 * Pure scanner — caller decides how to render the candidates.
 */

interface LexicalNode {
  type?: string;
  tag?: string;
  text?: string;
  children?: LexicalNode[];
}

const HEADING_TAGS = new Set(['h2', 'h3']);

const collectText = (node: LexicalNode): string => {
  if (typeof node.text === 'string') return node.text;
  if (!node.children) return '';
  return node.children.map(collectText).join('');
};

const countWords = (raw: string): number => {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).length;
};

const isQuestion = (text: string): boolean => /\?\s*$/.test(text.trim());

const QUALITY_IDEAL_MIN = 40;
const QUALITY_IDEAL_MAX = 60;
const QUALITY_OK_MIN = 25;
const QUALITY_OK_MAX = 80;

export type FeaturedSnippetQuality = 'great' | 'okay' | 'weak';

export interface FeaturedSnippetCandidate {
  readonly question: string;
  readonly answerWordCount: number;
  readonly quality: FeaturedSnippetQuality;
}

export interface FeaturedSnippetReport {
  readonly candidates: readonly FeaturedSnippetCandidate[];
  /** Best quality found across all candidates (undefined when none). */
  readonly best: FeaturedSnippetQuality | null;
}

const qualityFor = (words: number): FeaturedSnippetQuality => {
  if (words >= QUALITY_IDEAL_MIN && words <= QUALITY_IDEAL_MAX) return 'great';
  if (words >= QUALITY_OK_MIN && words <= QUALITY_OK_MAX) return 'okay';
  return 'weak';
};

const bestQuality = (
  a: FeaturedSnippetQuality | null,
  b: FeaturedSnippetQuality,
): FeaturedSnippetQuality => {
  const rank: Record<FeaturedSnippetQuality, number> = { weak: 0, okay: 1, great: 2 };
  if (a == null) return b;
  return rank[b] > rank[a] ? b : a;
};

/**
 * Walk a Lexical body and return every (question heading → answer
 * paragraph) pair. The "answer" is the first paragraph immediately
 * following the heading at the same nesting level.
 */
export const detectFeaturedSnippetCandidates = (
  body: unknown,
): FeaturedSnippetReport => {
  if (!body || typeof body !== 'object') return { candidates: [], best: null };
  const root = (body as { root?: LexicalNode }).root;
  if (!root || !root.children) return { candidates: [], best: null };

  const candidates: FeaturedSnippetCandidate[] = [];
  let best: FeaturedSnippetQuality | null = null;
  const children = root.children;

  for (let i = 0; i < children.length; i += 1) {
    const node = children[i];
    if (!node) continue;
    if (node.type !== 'heading' || typeof node.tag !== 'string' || !HEADING_TAGS.has(node.tag)) {
      continue;
    }
    const heading = collectText(node).trim();
    if (heading.length === 0 || !isQuestion(heading)) continue;

    // Look at the next sibling — only the first paragraph counts as
    // the snippet body. If the next node is another heading, skip.
    const next = children[i + 1];
    if (!next || next.type === 'heading') continue;
    const answerText = collectText(next).trim();
    if (answerText.length === 0) continue;
    const words = countWords(answerText);
    const quality = qualityFor(words);
    candidates.push({
      question: heading,
      answerWordCount: words,
      quality,
    });
    best = bestQuality(best, quality);
  }

  return { candidates, best };
};
