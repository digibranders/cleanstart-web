/**
 * Flattens a Lexical richText value into plain text. Shared by the JSON-LD
 * FAQPage builder (`acceptedAnswer.text` must be a plain string), the FAQ
 * admin row-label "answered" check, and the CSV/XLSX field exporter.
 *
 * Block-level nodes (paragraph, list item) are joined with `. ` so content
 * that reads as separate lines in the editor doesn't run together as one
 * sentence — a bare space-join makes "Step one" + "Step two" read as
 * "Step oneStep two". A trailing `.`/`?`/`!`/`:` on a block is left as-is
 * rather than doubled.
 */
type LexicalNodeLike = {
  type?: string;
  text?: string;
  children?: unknown[];
};

const BLOCK_TYPES = new Set(['paragraph', 'listitem', 'heading', 'quote']);
const TERMINAL_PUNCTUATION = /[.!?:]["'”’)\s]*$/;

const inlineText = (node: unknown): string => {
  if (node == null || typeof node !== 'object') return '';
  const n = node as LexicalNodeLike;
  if (n.type === 'text' && typeof n.text === 'string') return n.text;
  if (n.type === 'linebreak') return ' ';
  if (Array.isArray(n.children)) return n.children.map(inlineText).join('');
  return '';
};

const blockTexts = (nodes: unknown[]): string[] => {
  const out: string[] = [];
  for (const node of nodes) {
    if (node == null || typeof node !== 'object') continue;
    const n = node as LexicalNodeLike;
    if (n.type === 'list' && Array.isArray(n.children)) {
      out.push(...blockTexts(n.children));
      continue;
    }
    if (n.type === 'listitem' && Array.isArray(n.children)) {
      const nestedLists = n.children.filter(
        (child) => (child as LexicalNodeLike | null | undefined)?.type === 'list',
      ) as LexicalNodeLike[];
      // A Tab-indented list item's only content is the nested list itself
      // (standard Lexical nesting). Recurse into it block-by-block instead
      // of falling through to the flatten-with-no-separator path below.
      if (nestedLists.length > 0) {
        const inlineChildren = n.children.filter(
          (child) => (child as LexicalNodeLike | null | undefined)?.type !== 'list',
        );
        const text = inlineChildren.map(inlineText).join('').trim();
        if (text.length > 0) out.push(text);
        for (const nested of nestedLists) {
          out.push(...blockTexts(nested.children ?? []));
        }
        continue;
      }
    }
    if (n.type && BLOCK_TYPES.has(n.type)) {
      const text = inlineText(n).trim();
      if (text.length > 0) out.push(text);
      continue;
    }
    // Unknown/unsupported node type (shouldn't occur given the constrained
    // FAQ editor, but degrade gracefully rather than dropping content).
    const fallback = inlineText(n).trim();
    if (fallback.length > 0) out.push(fallback);
  }
  return out;
};

export const lexicalToPlainText = (value: unknown): string => {
  const root = (value as { root?: { children?: unknown[] } } | null)?.root;
  if (!root || !Array.isArray(root.children)) return '';
  return blockTexts(root.children)
    .map((block) => (TERMINAL_PUNCTUATION.test(block) ? block : `${block}.`))
    .join(' ')
    .trim();
};
