import type { GraphNode } from "../types";

/** The primary Schema.org type of a node (first entry when `@type` is an array). */
export const primaryType = (node: GraphNode): string =>
  Array.isArray(node["@type"]) ? (node["@type"][0] ?? "") : node["@type"];

/**
 * Per-`@type` merge (INV-5). Each override node replaces the first base
 * node sharing its primary `@type`; an override node with no matching
 * base type is appended. Non-overridden base nodes are untouched, which
 * is what lets a later global change still flow into an overridden page.
 * Returns a new array — never mutates the inputs.
 */
export const mergeByType = (base: GraphNode[], overrideNodes: GraphNode[]): GraphNode[] => {
  const result = [...base];
  for (const node of overrideNodes) {
    const type = primaryType(node);
    const idx = result.findIndex((existing) => primaryType(existing) === type);
    if (idx >= 0) {
      result[idx] = node;
    } else {
      result.push(node);
    }
  }
  return result;
};

/**
 * Collapse nodes that share an `@id` into one (last value wins, first
 * position kept). Nodes without an `@id` are always preserved. Returns a
 * new array.
 */
export const dedupeById = (nodes: GraphNode[]): GraphNode[] => {
  const indexById = new Map<string, number>();
  const out: GraphNode[] = [];
  for (const node of nodes) {
    const id = node["@id"];
    if (typeof id === "string") {
      const existing = indexById.get(id);
      if (existing !== undefined) {
        out[existing] = node;
        continue;
      }
      indexById.set(id, out.length);
    }
    out.push(node);
  }
  return out;
};
