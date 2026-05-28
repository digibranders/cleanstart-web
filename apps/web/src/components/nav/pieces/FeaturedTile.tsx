import Link from "next/link";
import type { ReactNode } from "react";
import type { Accent } from "@/components/nav/pieces/PanelHeader";
import { ACCENT_COLOR } from "@/components/nav/pieces/PanelHeader";

const ACCENT_BORDER: Record<Accent, string> = {
  cyan: "rgba(44,193,235,0.15)",
  green: "rgba(108,255,194,0.15)",
  purple: "rgba(164,140,255,0.15)",
  magenta: "rgba(255,138,184,0.15)",
};

type Props = {
  href: string;
  accent: Accent;
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
  eyebrow,
  headline,
  sub,
  body,
  footer,
  minHeight = 220,
}: Props) {
  return (
    <Link
      href={href}
      className="flex flex-col justify-between rounded-[12px] border p-4 text-white transition-colors"
      style={{
        background: "#1c1530",
        borderColor: ACCENT_BORDER[accent],
        minHeight,
      }}
    >
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
    </Link>
  );
}
