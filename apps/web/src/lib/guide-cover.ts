/**
 * Auto-generated guide cover support.
 *
 * Most guides have no cover image, so instead of a flat placeholder we
 * render a branded "keyword cover" (see app/guide-cover/[slug]/route.tsx).
 * The keyword is derived from the title — guide titles are reliably shaped
 * as "X: …" or "What is X", so the lead phrase is the topic.
 */

const LEAD_FILLER = /^(what(?:'s| is| are)?|how to|a guide to|guide to|the|an|a)\s+/i;

/**
 * Short topic phrase for a guide cover, derived from its title:
 *   "Hardened Images: Definition, Docker…"            → "Hardened Images"
 *   "What Is Attack Surface Reduction in Containers"  → "Attack Surface Reduction in Containers"
 * Takes the lead phrase before a colon, strips question/filler leads, and
 * caps length so it stays legible at display size.
 */
export function deriveCoverKeyword(title: string | null | undefined): string {
  let s = (title ?? "").trim();
  const colon = s.indexOf(":");
  if (colon > 2 && colon <= 60) s = s.slice(0, colon).trim();
  s = s.replace(LEAD_FILLER, "").trim();
  const words = s.split(/\s+/).filter(Boolean);
  if (words.length > 7) s = words.slice(0, 7).join(" ");
  return s.trim() || "CleanStart Guide";
}

/**
 * URL for the generated cover image. The keyword is carried in the PATH
 * (not a query string) so Next's image optimizer accepts and downsizes it
 * — local images with a query string are rejected by default. Forward
 * slashes are dropped to avoid an encoded-slash path segment.
 */
export function guideCoverPath(keyword: string): string {
  return `/guide-cover/${encodeURIComponent(keyword.replace(/\//g, " "))}`;
}
