import { slugify } from './slugify';

const DEFAULT_WORDS_PER_MINUTE = 220;

export type Heading = {
  level: 2 | 3 | 4 | 5 | 6;
  text: string;
  anchor: string;
};

export type LexicalSummary = {
  wordCount: number;
  readingMinutes: number;
  headings: Heading[];
};

type LexicalNode = {
  type?: string;
  tag?: string;
  text?: string;
  children?: LexicalNode[];
};

const HEADING_TAGS: ReadonlySet<string> = new Set(['h2', 'h3', 'h4', 'h5', 'h6']);

const collectText = (node: LexicalNode): string => {
  if (typeof node.text === 'string') return node.text;
  if (!node.children) return '';
  return node.children.map(collectText).join(' ');
};

const headingLevel = (tag: string): Heading['level'] | null => {
  switch (tag) {
    case 'h2':
      return 2;
    case 'h3':
      return 3;
    case 'h4':
      return 4;
    case 'h5':
      return 5;
    case 'h6':
      return 6;
    default:
      return null;
  }
};

const countWords = (text: string): number => {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).length;
};

/**
 * Walk a Lexical JSON tree and pull a summary of body content.
 *
 * - wordCount: total words across all text leaves
 * - readingMinutes: ceil(wordCount / 220) — adult silent reading speed,
 *   matches the Medium / Substack convention
 * - headings: ordered list of H2–H6 with auto-slugified anchors for
 *   the rendered table of contents
 */
export const extractFromLexical = (
  body: unknown,
  options?: { wordsPerMinute?: number },
): LexicalSummary => {
  const wpm = options?.wordsPerMinute ?? DEFAULT_WORDS_PER_MINUTE;
  if (!body || typeof body !== 'object') {
    return { wordCount: 0, readingMinutes: 0, headings: [] };
  }

  const root = (body as { root?: LexicalNode }).root;
  if (!root || !root.children) {
    return { wordCount: 0, readingMinutes: 0, headings: [] };
  }

  const headings: Heading[] = [];
  let totalWords = 0;
  const seenAnchors = new Map<string, number>();

  const walk = (node: LexicalNode): void => {
    if (node.type === 'heading' && typeof node.tag === 'string' && HEADING_TAGS.has(node.tag)) {
      const text = collectText(node).trim();
      if (text.length > 0) {
        const level = headingLevel(node.tag);
        if (level != null) {
          const baseAnchor = slugify(text) || 'section';
          const previous = seenAnchors.get(baseAnchor) ?? 0;
          const anchor = previous === 0 ? baseAnchor : `${baseAnchor}-${previous + 1}`;
          seenAnchors.set(baseAnchor, previous + 1);
          headings.push({ level, text, anchor });
        }
      }
    }

    if (typeof node.text === 'string') {
      totalWords += countWords(node.text);
    }

    if (node.children) {
      for (const child of node.children) walk(child);
    }
  };

  for (const child of root.children) walk(child);

  return {
    wordCount: totalWords,
    readingMinutes: totalWords === 0 ? 0 : Math.max(1, Math.ceil(totalWords / wpm)),
    headings,
  };
};
