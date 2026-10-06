import Link from "next/link";
import { NavIcon } from "@/components/nav/icons/NavIcon";
import { ArrowGlyph } from "@/components/nav/pieces/ArrowGlyph";
import { SECTION_LABEL, StageTrack } from "@/components/nav/pieces/TricorderParts";

type Props = {
  href: string;
  label: string;
  description: string;
  icon: string;
};

/**
 * Tricorder's slot in the Products menu. It is the platform under the three
 * products, not a fourth product, so it sits in its own column on the elevated
 * hero surface and shows what it does (the four stages) instead of
 * reading as another row. Nothing inside is interactive, so the whole card is
 * the link.
 */
export function TricorderCard({ href, label, description, icon }: Props) {
  return (
    <Link
      href={href}
      className="cs-hero-surface group/cta flex h-full flex-col rounded-[14px] p-[18px] text-white outline-none transition-[box-shadow] duration-200 ease-out hover:shadow-[inset_0_1px_0_rgba(140,120,255,0.4),0_1px_0_rgba(0,0,0,0.25),0_12px_32px_-20px_rgba(0,0,0,0.6)] focus-visible:ring-2 focus-visible:ring-[#33BAEC]"
    >
      <div className="flex items-center gap-3">
        <div className="cs-chip flex h-14 w-14 shrink-0 items-center justify-center rounded-[10px]">
          <NavIcon id={icon} size={30} className="cs-nav-glyph" />
        </div>
        <div className="min-w-0">
          <div className="text-[19px] font-semibold leading-none tracking-[-0.015em] text-white/95">
            {label}
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-[#2cc1eb]">
            <span aria-hidden className="h-1 w-1 rounded-full bg-[#2cc1eb]" />
            Platform behind all three products
          </div>
        </div>
      </div>

      <p className="mt-3.5 text-[12.5px] leading-relaxed text-white/60">{description}</p>

      <div className="mt-auto pt-4">
        <div className="border-t border-white/[0.07] pt-3.5">
          <div className={`${SECTION_LABEL} mb-3`}>How it decides</div>
          <StageTrack />
        </div>

        <span className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#2cc1eb]">
          Explore {label}
          <ArrowGlyph direction="right" size={13} />
        </span>
      </div>
    </Link>
  );
}
