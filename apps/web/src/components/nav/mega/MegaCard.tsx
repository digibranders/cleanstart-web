import Link from "next/link";
import type { ReactNode } from "react";
import { NavIcon } from "@/components/nav/icons/NavIcon";
import { ArrowGlyph } from "@/components/nav/pieces/ArrowGlyph";
import { MegaArrowButton } from "@/components/nav/mega/MegaArrowButton";

type Props = {
  href: string;
  label: string;
  description?: string;
  icon: string;
  built?: boolean;
  /** External destination — opens in a new tab, arrow renders diagonal. */
  external?: boolean;
  /** Compact row variant for dense category lists (no description, no glow). */
  dense?: boolean;
  /** Optional live-data line under the description (e.g. a version chip). */
  meta?: ReactNode;
};

const ICON_TILE =
  "cs-mega-icon flex items-center justify-center rounded-[10px] text-[#c6b2f7]";

function CardInner({ label, description, icon, external, meta }: Omit<Props, "href" | "built" | "dense">) {
  return (
    <>
      <div className={`${ICON_TILE} h-[38px] w-[38px]`}>
        <NavIcon id={icon} size={18} />
      </div>
      <div className="mt-3 pr-9">
        <div className="text-sm font-semibold leading-tight text-white/90">{label}</div>
        {description && (
          <div className="mt-1.5 text-xs leading-snug text-white/55">{description}</div>
        )}
        {meta && <div className="mt-2.5">{meta}</div>}
      </div>
      <MegaArrowButton
        direction={external ? "up-right" : "right"}
        size={36}
        className="absolute bottom-4 right-4"
      />
    </>
  );
}

/**
 * Signature mega-menu card (v2 — Figma node 1672:1420): an indigo glow rising
 * from the bottom of a near-black navy tile, a lavender-tinted icon tile, title,
 * description, and a circular indigo arrow button. The `dense` variant is a
 * compact icon + label row for category-heavy menus (Resources).
 */
export function MegaCard({
  href,
  label,
  description,
  icon,
  built = true,
  external = false,
  dense = false,
  meta,
}: Props) {
  if (dense) {
    const denseInner = (
      <>
        <div className={`${ICON_TILE} h-7 w-7 shrink-0`}>
          <NavIcon id={icon} size={14} />
        </div>
        <span className="min-w-0 text-[13px] font-semibold leading-tight text-white/90">{label}</span>
        <ArrowGlyph
          direction={external ? "up-right" : "right"}
          size={12}
          className="ml-auto shrink-0 text-white/35 opacity-0 transition-opacity duration-200 group-hover/card:opacity-100"
        />
      </>
    );
    const denseClass =
      "cs-mega-card-dense group/card flex items-center gap-2 rounded-[10px] px-2.5 py-1";
    if (!built) {
      return (
        <span className={`${denseClass} cursor-default opacity-50`} aria-disabled="true" tabIndex={-1}>
          {denseInner}
        </span>
      );
    }
    return external ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className={denseClass}>
        {denseInner}
      </a>
    ) : (
      <Link href={href} className={denseClass}>
        {denseInner}
      </Link>
    );
  }

  const cardClass =
    "cs-mega-card group/card relative flex min-h-[150px] flex-col overflow-hidden rounded-[16px] p-4";
  const innerProps = { label, icon, external, ...(description ? { description } : {}), ...(meta ? { meta } : {}) };

  if (!built) {
    return (
      <span className={`${cardClass} cursor-default opacity-50`} aria-disabled="true" tabIndex={-1}>
        <CardInner {...innerProps} />
      </span>
    );
  }
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cardClass}>
      <CardInner {...innerProps} />
    </a>
  ) : (
    <Link href={href} className={cardClass}>
      <CardInner {...innerProps} />
    </Link>
  );
}
