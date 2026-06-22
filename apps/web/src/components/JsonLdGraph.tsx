import type { SchemaGraph } from "@cleanstart/schema";

interface JsonLdGraphProps {
  /** The composed single connected graph for this page (see buildPageGraph). */
  graph: SchemaGraph;
  /** Optional stable id (harmless; one graph per page means no React dedupe). */
  id?: string;
}

/**
 * Emits the page's single `<script type="application/ld+json">` from one
 * connected `@graph`. Replaces the old per-schema <JsonLd> blocks.
 *
 * IMPORTANT: never render content here without escaping `</script>`.
 * `JSON.stringify` does not escape it — we replace `<` manually.
 */
export function JsonLdGraph({ graph, id }: JsonLdGraphProps) {
  const json = JSON.stringify(graph).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires raw script content; payload is JSON-stringified and < escaped above.
      dangerouslySetInnerHTML={{ __html: json }}
      {...(id ? { id } : {})}
    />
  );
}
