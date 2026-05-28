import Link from "next/link";

export type Accent = "cyan" | "green" | "purple" | "magenta";

type Props = {
  eyebrow: string;
  tagline: string;
  accent: Accent;
  exitHref?: string;
  exitLabel?: string;
};

export const ACCENT_COLOR: Record<Accent, string> = {
  cyan: "#2cc1eb",
  green: "#6cffc2",
  purple: "#a48cff",
  magenta: "#ff8ab8",
};

export function PanelHeader({ eyebrow, tagline, accent, exitHref, exitLabel }: Props) {
  return (
    <div className="flex items-start justify-between border-b border-white/[0.05] pb-3.5">
      <div>
        <div
          className="text-[10px] font-bold uppercase tracking-[0.16em]"
          style={{ color: ACCENT_COLOR[accent] }}
        >
          {eyebrow}
        </div>
        <div className="mt-0.5 text-[11px] text-white/55">{tagline}</div>
      </div>
      {exitHref && exitLabel && (
        <Link
          href={exitHref}
          className="text-[11px] text-white/45 transition-colors hover:text-white/80"
        >
          {exitLabel} →
        </Link>
      )}
    </div>
  );
}
