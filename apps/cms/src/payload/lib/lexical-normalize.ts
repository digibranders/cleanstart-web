/**
 * Normalizers for Lexical document trees.
 *
 * Pure functions. Given a Lexical root (or any subtree), returns a new node
 * with the same shape but with adjacent sibling `list` nodes of the same
 * `listType`/`start` collapsed into a single `list`.
 *
 * Why this exists: Markdown- and Webflow-imported content frequently arrives
 * with every bullet wrapped in its own one-item `list` node, producing a
 * separate `<ul>` per bullet in the rendered HTML and visible per-list
 * margins between bullets. The renderer is faithful — the data is wrong.
 * This module fixes the data at write time (hook) and during one-shot
 * backfill.
 */

type LexicalNode = {
  type?: string;
  listType?: string;
  start?: number;
  children?: LexicalNode[];
  [key: string]: unknown;
};

export type LexicalRoot = {
  root: LexicalNode;
};

const isList = (node: LexicalNode | undefined): node is LexicalNode & { children: LexicalNode[] } =>
  Boolean(node && node.type === 'list' && Array.isArray(node.children));

const sameListShape = (a: LexicalNode, b: LexicalNode): boolean =>
  a.listType === b.listType && (a.start ?? 1) === (b.start ?? 1);

/**
 * Returns a new children array where consecutive `list` siblings with the
 * same `listType` + `start` have been merged into a single `list` carrying
 * their combined `listitem` children. Non-list nodes pass through unchanged
 * but are themselves recursed into.
 */
const mergeChildren = (children: LexicalNode[]): LexicalNode[] => {
  let changed = false;
  const out: LexicalNode[] = [];
  for (const child of children) {
    const normalized = mergeAdjacentLists(child);
    if (normalized !== child) changed = true;
    const prev = out[out.length - 1];
    if (prev && isList(prev) && isList(normalized) && sameListShape(prev, normalized)) {
      out[out.length - 1] = {
        ...prev,
        children: [...prev.children, ...normalized.children],
      };
      changed = true;
      continue;
    }
    out.push(normalized);
  }
  return changed ? out : children;
};

/**
 * Recursively normalize a Lexical node. Pure — input is never mutated, and
 * already-clean subtrees return the same reference (used by the hook and
 * backfill script to detect no-op writes).
 */
export const mergeAdjacentLists = (node: LexicalNode): LexicalNode => {
  if (!node || !Array.isArray(node.children) || node.children.length === 0) {
    return node;
  }
  const nextChildren = mergeChildren(node.children);
  if (nextChildren === node.children) return node;
  return { ...node, children: nextChildren };
};

/**
 * Normalize a Lexical document (the `{ root: ... }` shape Payload stores in
 * a richText field). Returns `value` unchanged if it isn't a recognizable
 * Lexical document, so it's safe to call on `undefined` / `null` /
 * non-Lexical payloads.
 */
export const normalizeLexicalValue = <T>(value: T): T => {
  if (!value || typeof value !== 'object') return value;
  const v = value as unknown as { root?: LexicalNode };
  if (!v.root || typeof v.root !== 'object') return value;
  const nextRoot = mergeAdjacentLists(v.root);
  if (nextRoot === v.root) return value;
  return { ...(value as object), root: nextRoot } as T;
};

/**
 * Returns true if normalization would change the document. Used by the
 * backfill script to skip no-op writes.
 */
export const needsListMerge = (value: unknown): boolean => {
  if (!value || typeof value !== 'object') return false;
  const v = value as { root?: LexicalNode };
  if (!v.root) return false;
  return hasAdjacentMergeableLists(v.root);
};

const hasAdjacentMergeableLists = (node: LexicalNode): boolean => {
  if (!node.children || node.children.length === 0) return false;
  for (let i = 1; i < node.children.length; i++) {
    const a = node.children[i - 1];
    const b = node.children[i];
    if (isList(a) && isList(b) && sameListShape(a, b)) return true;
  }
  return node.children.some(hasAdjacentMergeableLists);
};
