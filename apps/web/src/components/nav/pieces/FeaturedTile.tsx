import Link from "next/link";
import type { ReactNode } from "react";
import type { Accent } from "@/components/nav/pieces/PanelHeader";
import { ACCENT_COLOR } from "@/components/nav/pieces/PanelHeader";

const ACCENT_BORDER: Record<Accent, string> = {
  cyan: "rgba(44,193,235,0.20)",
  green: "rgba(108,255,194,0.20)",
  purple: "rgba(164,140,255,0.20)",
  magenta: "rgba(255,138,184,0.20)",
};

type Props = {
  href: string;
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
  const className =
    "group/cta cs-tile-glass flex flex-col justify-between rounded-[14px] border p-4 text-white transition-[transform,border-color] duration-200 hover:-translate-y-px";
  const style = {
    borderColor: ACCENT_BORDER[accent],
    minHeight,
  };
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
