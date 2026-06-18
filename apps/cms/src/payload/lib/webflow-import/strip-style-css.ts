/**
 * Remove leaked stylesheet paragraphs from a Lexical `body`.
 *
 * The Webflow import's HTML→Lexical converter used to harvest the text of an
 * embedded `<style>` block as a body paragraph (the converter now drops
 * `<style>`/`<script>` — see `html-to-lexical.ts` `DROP_TAGS` — so this only
 * cleans docs imported before that fix). The symptom: raw CSS rules like
 * `.what-is-mythos-box { padding: 20px; ... }` render as visible body text.
 *
 * The detector is deliberately conservative so it never touches prose that
 * merely mentions CSS: a paragraph qualifies only when its whole text begins
 * with a CSS selector (`.`/`#`/`@`) AND contains a `{ prop: value; }` block.
 * Code samples live in `codeBlock` nodes, not paragraphs, so they're untouched.
 */

interface LexNode {
  type?: string;
  text?: string;
  children?: LexNode[];
  [key: string]: unknown;
}

interface LexBody {
  root?: { children?: LexNode[]; [key: string]: unknown };
  [key: string]: unknown;
}

/** Concatenated text of a node's entire subtree. */
const nodeText = (node: LexNode): string => {
  let out = typeof node.text === 'string' ? node.text : '';
  for (const child of node.children ?? []) out += nodeText(child);
  return out;
};

/**
 * True when a string is a leaked stylesheet (not prose, not a code sample).
 * Requires: starts with a CSS selector token, and contains at least one
 * declaration block with a `property: value;` inside braces.
 */
export const looksLikeLeakedCss = (raw: string): boolean => {
  const text = raw.trim();
  if (text.length < 20) return false;
  if (!/^[.#@][\w-]/.test(text)) return false;
  if (!/\{[^{}]*[\w-]+\s*:\s*[^{};]+;?[^{}]*\}/.test(text)) return false;
  return true;
};

/**
 * Strip top-level paragraph nodes whose text is a leaked stylesheet. Returns the
 * (possibly new) body and the count removed. Pure — never mutates the input.
 * Returns `removed: 0` and the original reference when there is nothing to do.
 */
export const stripLeakedStyleCss = (
  body: unknown,
): { body: unknown; removed: number } => {
  const typed = body as LexBody | null | undefined;
  const root = typed?.root;
  const children = root?.children;
  if (!root || !Array.isArray(children)) return { body, removed: 0 };

  const kept = children.filter(
    (node) => !(node?.type === 'paragraph' && looksLikeLeakedCss(nodeText(node))),
  );
  const removed = children.length - kept.length;
  if (removed === 0) return { body, removed: 0 };

  return {
    body: { ...typed, root: { ...root, children: kept } },
    removed,
  };
};
