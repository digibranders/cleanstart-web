import { composeGraph, type GraphNode, type SchemaGraph, webPageSchema } from "@cleanstart/schema";

import { getRegistryEntry } from "../page-registry";

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
 * Build a STATIC/LISTING route's JSON-LD @graph from the page registry in one
 * step: fetch the row (override + functional WebPage @type + title), auto-emit
 * the matching WebPage node (AboutPage, CollectionPage, …) when `webPageType`
 * is set, then compose with the page's own Layer-1 `nodes` and the override.
 *
 * Build/ISR-time only — the registry fetch is cached, so nothing is added to
 * the runtime request path (INV-1). Fails safe to auto-only when the CMS is
 * down (getRegistryEntry returns { webPageType: 'none' }).
 */
export async function getPageGraph(path: string, nodes: GraphNode[]): Promise<SchemaGraph> {
  const { override, webPageType, title } = await getRegistryEntry(path);
  const auto =
    webPageType !== "none"
      ? [webPageSchema({ type: webPageType, path, name: title ?? "" }), ...nodes]
      : nodes;
  return composeGraph({ auto, override });
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
