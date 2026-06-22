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
 * One editor-authored add-on (Layer 2). `blockType` selects the
 * Schema.org shape (faqPage, howTo, videoObject, …); the rest of the
 * keys carry that block's data.
 */
export interface AddonBlock {
  blockType: string;
  [key: string]: JsonLdValue | undefined;
}

/**
 * Inputs to {@link composeGraph}. `auto` is Layer 1 (derived from
 * current doc fields + globals — always live). `addons` is Layer 2.
 * `override` is the raw Layer 3 paste; it is validated before use and
 * dropped (fail-safe to auto) if invalid. See INV-5 in the plan.
 */
export interface ComposeInput {
  auto: GraphNode[];
  addons?: AddonBlock[];
  override?: unknown;
}
