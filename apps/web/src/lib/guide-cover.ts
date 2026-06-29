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
 * The text painted on a guide's generated cover (cards + social image):
 * the editor-set `coverTitle` verbatim when present (capped for legibility),
 * else the title-derived topic phrase.
 */
export function guideCoverKeyword(guide: {
  coverTitle?: string | null;
  title?: string | null;
}): string {
  const manual = guide.coverTitle?.trim();
  if (manual) return manual.slice(0, 80);
  return deriveCoverKeyword(guide.title);
}

/**
 * Cover-title display size, scaled down as the title gets longer so it never
 * clips and stays legible. Same length tiers expressed in two unit systems:
 *   - `px`  for the 1200×630 satori OG route (`/guide-cover/[slug]`)
 *   - `cqw` (% of the cover's own width) for the on-page CSS cover
 *
 * `coverTitle` is capped at 80 chars upstream, so the smallest tier still has
 * to seat ~80 characters in ≤3 lines on both surfaces.
 */
export function coverTitleSize(text: string): { px: number; cqw: number } {
  const len = text.trim().length;
  if (len <= 20) return { px: 84, cqw: 6 };
  if (len <= 32) return { px: 72, cqw: 5.2 };
  if (len <= 46) return { px: 62, cqw: 4.5 };
  if (len <= 62) return { px: 52, cqw: 3.9 };
  return { px: 44, cqw: 3.4 };
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
