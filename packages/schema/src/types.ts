/**
 * Core JSON-LD types shared across the schema composer.
 *
 * A `GraphNode` is one Schema.org entity (Article, Organization, …). A
 * `SchemaGraph` is the single connected `@graph` a page emits — one
 * `<script type="application/ld+json">` per page (see compose-graph).
 */

export type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | JsonLdValue[]
  | { [key: string]: JsonLdValue };

/** One Schema.org node. `@type` is required; `@id` enables cross-references. */
export type GraphNode = {
  "@type": string | string[];
  "@id"?: string;
} & {
  [key: string]: JsonLdValue | undefined;
};

/** The single connected graph a page renders. */
export interface SchemaGraph {
  "@context": "https://schema.org";
  "@graph": GraphNode[];
}

/**
 * Inputs to {@link composeGraph}.
 *
 * - `auto` — Layer 1 nodes, derived from CURRENT doc fields + globals
 *   (always live).
 * - `addonNodes` — Layer 2 nodes, already built by the caller's add-on
 *   builders (CMS `dispatchAddons`, or the web adapter). composeGraph
 *   does not know how to turn editor blocks into nodes — that mapping
 *   stays with the builders to avoid duplication.
 * - `override` — raw Layer 3 paste. Validated before use and dropped
 *   (fail-safe to auto + add-ons) if invalid. Merged per-`@type`. See
 *   INV-5 in the plan.
 */
export interface ComposeInput {
  auto: GraphNode[];
  addonNodes?: GraphNode[];
  override?: unknown;
}
