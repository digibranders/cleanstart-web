import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowGlyph } from "@/components/nav/pieces/ArrowGlyph";

type Props = {
  /** The single anchor line that owns the eye — the largest type in the panel. */
  headline: string;
  sub?: string;
  /** Proof block, command, or any supporting content between sub and CTA. */
  children?: ReactNode;
  /** Exactly one decisive, value-led action. The only cyan in the panel body. */
  ctaLabel: string;
  ctaHref: string;
  ctaExternal?: boolean;
  minHeight?: number;
};

/**
 * The featured "hero" surface — one per menu. Rendered as a plain container
 * (not a single big link) so its proof block and copy-command can host their
 * own interactive targets without nesting anchors; the CTA at the bottom is the
 * one navigational action. Depth comes from `.cs-hero-surface` (a clearly
 * elevated, brand-edged tone), not from a border or glow.
 */
export function HeroTile({
  headline,
  sub,
  children,
  ctaLabel,
  ctaHref,
  ctaExternal,
  minHeight = 248,
}: Props) {
  const ctaClassName =
    "group/cta mt-3.5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#2cc1eb]";

  return (
    <div
      className="cs-hero-surface flex flex-col justify-between rounded-[14px] p-4 text-white"
      style={{ minHeight }}
    >
      <div>
        <h3 className="text-[19px] font-semibold leading-[1.15] tracking-[-0.015em] text-white/95">
          {headline}
        </h3>
        {sub && (
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/60">{sub}</p>
        )}
        {children && <div className="mt-3.5">{children}</div>}
      </div>

      {ctaExternal ? (
        <a
          href={ctaHref}
          target="_blank"
          rel="noopener noreferrer"
          className={ctaClassName}
        >
          {ctaLabel}
          <ArrowGlyph direction="up-right" size={13} />
        </a>
      ) : (
        <Link href={ctaHref} className={ctaClassName}>
          {ctaLabel}
          <ArrowGlyph direction="right" size={13} />
        </Link>
      )}
    </div>
  );
}
