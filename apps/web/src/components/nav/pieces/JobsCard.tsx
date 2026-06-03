import Link from "next/link";
import { ArrowGlyph } from "@/components/nav/pieces/ArrowGlyph";

const ACCENT = "#2cc1eb";

// Brand gradient (the testimonial-deck indigo→violet) shared by the Company
// menu's stacked cards so they read as a matched pair. Exact stops per the
// design system; white text stays fully legible across the range.
export const BRAND_GRADIENT = "linear-gradient(135deg, #1F1740 0%, #242682 55%, #3F279E 100%)";

const EYEBROW = "text-[10px] font-bold uppercase tracking-[0.14em] text-white/55";

/**
 * Compact careers card for the Company mega menu. Shows the live open-roles
 * count and links to the full listing — no per-role list. Rendered only when
 * {@link count} is greater than zero, so it never advertises "0 open roles".
 */
export function JobsCard({ count }: { count: number }) {
  const roleWord = count === 1 ? "role" : "roles";
  return (
    <Link
      href="/careers"
      className="cs-hero-surface group/cta flex flex-col rounded-[14px] p-4 text-white"
      style={{ background: BRAND_GRADIENT }}
    >
      <div className={EYEBROW}>Careers</div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-[26px] font-bold leading-none tracking-[-0.02em]">{count}</span>
        <span className="text-[15px] font-semibold text-white/85">open {roleWord}</span>
      </div>
      <div className="mt-1.5 text-xs leading-relaxed text-white/65">
        Remote-friendly. Equity-led. Across engineering, GTM &amp; design.
      </div>
      <div
        className="mt-auto pt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold"
        style={{ color: ACCENT }}
      >
        View all {roleWord} <ArrowGlyph direction="right" size={12} />
      </div>
    </Link>
  );
}
