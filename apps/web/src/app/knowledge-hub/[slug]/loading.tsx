/**
 * Instant skeleton for a Knowledge Hub article. Rendered as the Suspense
 * fallback for `[slug]/page.tsx` while the article loads, so navigating between
 * articles paints a content-shaped placeholder in the `<article>` slot instead
 * of bubbling up to the root spinner. The surrounding layout (Header, hero,
 * sidebar) stays mounted — this fills only the article column, light theme to
 * match the white reading surface.
 *
 * Mirrors `KnowledgeHubArticle`: breadcrumb → H1 (var(--fs-h2)) → abstract →
 * prose body. Pure CSS `animate-pulse`, no data, no client JS.
 */

// width % per body line; 0 = a paragraph gap. Stable ids so React keys don't
// fall back to the array index (biome lint/suspicious/noArrayIndexKey).
const BODY_LINES = [
  { id: "l1", w: 98 },
  { id: "l2", w: 90 },
  { id: "l3", w: 94 },
  { id: "l4", w: 72 },
  { id: "gap1", w: 0 },
  { id: "l5", w: 96 },
  { id: "l6", w: 88 },
  { id: "l7", w: 91 },
  { id: "l8", w: 64 },
  { id: "gap2", w: 0 },
  { id: "l9", w: 93 },
  { id: "l10", w: 80 },
  { id: "l11", w: 86 },
] as const;

export default function Loading(): React.ReactElement {
  return (
    <output
      aria-live="polite"
      aria-label="Loading article"
      className="block w-full animate-pulse"
    >
      <span className="sr-only">Loading…</span>

      {/* breadcrumb (Home / Category) */}
      <div className="flex items-center gap-2">
        <div className="h-3.5 w-12 rounded bg-black/[0.06]" />
        <div className="h-3.5 w-3 rounded bg-black/[0.04]" />
        <div className="h-3.5 w-28 rounded bg-black/[0.06]" />
      </div>

      {/* H1 — var(--fs-h2), ~two lines */}
      <div className="mt-4 space-y-2.5">
        <div className="h-7 w-11/12 rounded-lg bg-black/[0.08]" />
        <div className="h-7 w-3/5 rounded-lg bg-black/[0.08]" />
      </div>

      {/* abstract */}
      <div className="mt-6 space-y-2.5">
        <div className="h-4 w-full rounded bg-black/[0.06]" />
        <div className="h-4 w-4/5 rounded bg-black/[0.06]" />
      </div>

      {/* prose body — blank entries are paragraph gaps */}
      <div className="article-body mt-12 space-y-4">
        {BODY_LINES.map(({ id, w }) =>
          w === 0 ? (
            <div key={id} className="h-3" />
          ) : (
            <div
              key={id}
              className="h-4 rounded bg-black/[0.06]"
              style={{ width: `${w}%` }}
            />
          ),
        )}
      </div>
    </output>
  );
}
