import { composeGraph, type GraphNode, type SchemaGraph } from "@cleanstart/schema";

/**
 * Per-page glue between the JSON-LD builders and the unified composer.
 *
 * `nodes` are the page's Layer-1 nodes (built from the existing builders;
 * they may each carry their own `@context`, which the composer strips).
 * `override` is the raw editor paste read from `doc.seo.additionalSchema`
 * (or, for static pages, a pageRegistry row). Composition runs at
 * build/ISR time — no runtime CMS fetch is added (INV-1).
 */
export interface PageGraphInput {
  nodes: GraphNode[];
  override?: unknown;
}

export function buildPageGraph({ nodes, override }: PageGraphInput): SchemaGraph {
  return composeGraph({ auto: nodes, override });
}

/**
 * Extract the raw schema override from a CMS `seo` group, if present. The
 * field is admin/authenticated-read (Task 0.6), so an anonymous fetch
 * returns `undefined` here and the page composes auto-only — fail-safe.
 */
export function seoOverride(seo: unknown): unknown {
  if (seo != null && typeof seo === "object" && "additionalSchema" in seo) {
    return (seo as { additionalSchema?: unknown }).additionalSchema ?? undefined;
  }
  return undefined;
}
