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

/**
 * Node types whose subtree must not contribute TOC entries. Editors
 * sometimes style a table cell as H3/H4 for visual emphasis — those
 * are not section headings and would flood the sidebar with cell
 * labels. Word-count walking still recurses through these (table
 * prose still reads as body content).
 */
const TOC_OPAQUE_TYPES: ReadonlySet<string> = new Set(['table', 'tablerow', 'tablecell']);

/**
 * Lexical node types that contribute non-prose content. Skipped from
 * the word-count walk so a 200-line code listing doesn't inflate
 * reading time, and so embed cards (video / iframe / form) don't
 * count their internal labels as body words. The walker still
 * recurses INTO regular paragraphs, lists, quotes, etc.
 */
const NON_PROSE_TYPES: ReadonlySet<string> = new Set([
  'code',
  'code-highlight',
  'block',
  'inline-block',
  'horizontalrule',
  'linebreak',
  'tab',
]);

const collectText = (node: LexicalNode): string => {
  if (typeof node.text === 'string') return node.text;
  if (!node.children) return '';
  // Inline runs (bold/italic spans inside a heading) concatenate without a
  // separator — joining with a space would produce "Why  SBOM  matters"
  // for a heading like "Why **SBOM** matters". Whitespace within the
  // original text is preserved verbatim by the leaf nodes.
  return node.children.map(collectText).join('');
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

  const walk = (node: LexicalNode, opaqueDepth: number): void => {
    if (typeof node.type === 'string' && NON_PROSE_TYPES.has(node.type)) {
      // Code blocks, embeds, inline blocks, etc. don't count toward
      // body word count or reading time. Skip them and their subtree.
      return;
    }

    const nextOpaque =
      typeof node.type === 'string' && TOC_OPAQUE_TYPES.has(node.type)
        ? opaqueDepth + 1
        : opaqueDepth;

    if (
      nextOpaque === 0 &&
      node.type === 'heading' &&
      typeof node.tag === 'string' &&
      HEADING_TAGS.has(node.tag)
    ) {
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
      for (const child of node.children) walk(child, nextOpaque);
    }
  };

  for (const child of root.children) walk(child, 0);

  return {
    wordCount: totalWords,
    readingMinutes: totalWords === 0 ? 0 : Math.max(1, Math.ceil(totalWords / wpm)),
    headings,
  };
};

/**
 * Concat every text leaf in a Lexical body into a single space-
 * separated string. Used by the readability scorer + the JSON-LD
 * dispatcher when it needs raw prose for `description` fallback.
 */
export const collectPlainText = (body: unknown): string => {
  if (!body || typeof body !== 'object') return '';
  const root = (body as { root?: LexicalNode }).root;
  if (!root || !root.children) return '';
  const out: string[] = [];
  const walk = (node: LexicalNode): void => {
    if (typeof node.text === 'string' && node.text.length > 0) {
      out.push(node.text);
    }
    if (node.children) {
      for (const child of node.children) walk(child);
    }
  };
  for (const child of root.children) walk(child);
  return out.join(' ').replace(/\s+/g, ' ').trim();
};
