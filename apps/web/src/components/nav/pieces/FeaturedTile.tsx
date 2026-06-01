import Link from "next/link";
import type { ReactNode } from "react";
import type { Accent } from "@/components/nav/pieces/PanelHeader";
import { ACCENT_COLOR } from "@/components/nav/pieces/PanelHeader";

type Props = {
  /**
   * When set, the whole tile is a single link. When omitted, the tile renders
   * as a plain container (`<div>`) so its footer can host its own real links
   * without nesting anchors — used by Products, which has two distinct CTAs.
   */
  href?: string;
  accent: Accent;
  /** External destination — opens in a new tab with noopener noreferrer. Used by Products → images.cleanstart.com. */
  external?: boolean;
  /**
   * Optional tracked-uppercase eyebrow ABOVE the headline.
   * Pure typography in accent color — NOT a pill or chip.
   * Example: "NEXT EVENT · KUBECON EU".
   */
  eyebrow?: string;
  headline: string;
  sub?: string;
  body?: ReactNode;
  footer?: ReactNode;
  minHeight?: number;
};

export function FeaturedTile({
  href,
  accent,
  external,
  eyebrow,
  headline,
  sub,
  body,
  footer,
  minHeight = 220,
}: Props) {
  const linkClassName =
    "group/cta cs-tile-glass cs-tile-interactive flex flex-col justify-between rounded-[12px] p-4 text-white";
  const containerClassName =
    "cs-tile-glass flex flex-col justify-between rounded-[12px] p-4 text-white";
  const className = href ? linkClassName : containerClassName;
  const style = { minHeight };
  const inner = (
    <>
      <div>
        {eyebrow && (
          <div
            className="text-[10px] font-bold uppercase tracking-[0.14em]"
            style={{ color: ACCENT_COLOR[accent] }}
          >
            {eyebrow}
          </div>
        )}
        <div className="mt-2 text-[17px] font-bold leading-tight tracking-[-0.01em] text-white">
          {headline}
        </div>
        {sub && (
          <div className="mt-1.5 text-xs leading-relaxed text-white/65">{sub}</div>
        )}
        {body && <div className="mt-3">{body}</div>}
      </div>
      {footer && <div className="mt-3">{footer}</div>}
    </>
  );

  if (!href) {
    return (
      <div className={className} style={style}>
        {inner}
      </div>
    );
  }

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} style={style}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={className} style={style}>
      {inner}
    </Link>
  );
}
