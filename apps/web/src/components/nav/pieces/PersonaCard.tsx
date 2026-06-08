import Link from "next/link";
import { NavIcon } from "@/components/nav/icons/NavIcon";
import { ArrowGlyph } from "@/components/nav/pieces/ArrowGlyph";

type Props = {
  href: string;
  icon: string;
  label: string;
  description: string;
  /** Value-led action, e.g. "See what developers get". The only cyan on the card. */
  cta: string;
};

/**
 * Outcome-led persona card. Identity comes from a large, faded persona glyph in
 * the corner (presentation only — no new claims), the label is the title, and
 * the description carries the outcome. Surface is the shared neutral tile so the
 * two cards read as one system; the single brand accent (cyan) appears only on
 * the action line.
 */
export function PersonaCard({ href, icon, label, description, cta }: Props) {
  return (
    <Link
      href={href}
      className="cs-tile-glass cs-tile-interactive group/cta relative flex min-h-[182px] flex-col overflow-hidden rounded-[14px] p-[18px]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-5 -right-4 text-white opacity-[0.055] select-none"
      >
        <NavIcon id={icon} size={128} />
      </div>

      <div className="cs-chip flex h-10 w-10 items-center justify-center rounded-[9px]">
        <NavIcon id={icon} size={20} className="cs-nav-glyph" />
      </div>
      <div className="mt-3.5 text-[15px] font-semibold leading-tight text-white/95">
        {label}
      </div>
      <div className="mt-1.5 text-[12.5px] leading-snug text-white/62">
        {description}
      </div>
      <div className="mt-auto pt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#2cc1eb]">
        {cta}
        <ArrowGlyph direction="right" size={13} />
      </div>
    </Link>
  );
}
