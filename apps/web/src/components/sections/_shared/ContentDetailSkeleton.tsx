/**
 * Instant loading skeleton for CMS content detail pages (blog, guide, news,
 * resource, author, event, job). Rendered by each route's `loading.tsx` so a
 * client-side navigation paints an immediate content-shaped placeholder instead
 * of holding the previous page on screen while the server render completes.
 *
 * Pure presentational: no data, no client JS. The shimmer is a CSS-only
 * `animate-pulse` so it works inside the streamed loading fallback.
 */
export function ContentDetailSkeleton(): React.ReactElement {
  return (
    <output
      aria-live="polite"
      aria-label="Loading content"
      className="block w-full animate-pulse"
    >
      <span className="sr-only">Loading…</span>

      {/* Nav bar placeholder — detail pages render their own Header, which is
          absent during the loading state. */}
      <div className="h-16 w-full border-b border-white/5 bg-[#0b0712]" />

      {/* Hero block */}
      <div className="bg-[#0b0712] px-6 pb-16 pt-12">
        <div className="mx-auto w-full max-w-[var(--container-prose)]">
          <div className="h-4 w-24 rounded bg-white/10" />
          <div className="mt-6 h-10 w-11/12 rounded-lg bg-white/10" />
          <div className="mt-3 h-10 w-2/3 rounded-lg bg-white/10" />
          <div className="mt-8 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/10" />
            <div className="h-4 w-40 rounded bg-white/10" />
          </div>
        </div>
      </div>

      {/* Hero image */}
      <div className="bg-[#0b0712] px-6">
        <div className="mx-auto aspect-[16/9] w-full max-w-[var(--container-default)] rounded-2xl bg-white/[0.06]" />
      </div>

      {/* Body copy */}
      <div className="bg-white px-6 py-16">
        <div className="mx-auto w-full max-w-[var(--container-prose)] space-y-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="h-4 rounded bg-black/[0.06]"
              style={{ width: `${[96, 88, 92, 70, 95, 84, 90, 60, 80][i]}%` }}
            />
          ))}
        </div>
      </div>
    </output>
  );
}
