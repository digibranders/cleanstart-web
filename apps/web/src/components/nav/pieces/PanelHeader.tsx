import Link from "next/link";
import { ArrowGlyph } from "@/components/nav/pieces/ArrowGlyph";

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

/**
 * `http://` or `https://` destinations are treated as external — render as
 * a plain `<a target="_blank" rel="noopener noreferrer">` and show an
 * up-right arrow so users see the new-tab affordance.
 * `mailto:` opens the user's mail client (no new tab needed).
 * Anything else (relative paths) renders as a Next `<Link>` with a regular `→`.
 */
function isExternalUrl(href: string): boolean {
  return href.startsWith("http://") || href.startsWith("https://");
}

const EXIT_LINK =
  "group/cta inline-flex items-center gap-1 text-[11px] text-white/45 transition-colors hover:text-white/80";

export function PanelHeader({ eyebrow, tagline, exitHref, exitLabel }: Props) {
  return (
    <div className="flex items-start justify-between border-b border-white/[0.04] pb-3.5">
      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
          {eyebrow}
        </div>
        <div className="mt-0.5 text-[11px] text-white/55">{tagline}</div>
      </div>
      {exitHref && exitLabel && (
        isExternalUrl(exitHref) ? (
          <a
            href={exitHref}
            target="_blank"
            rel="noopener noreferrer"
            className={EXIT_LINK}
          >
            {exitLabel}
            <ArrowGlyph direction="up-right" size={10} />
          </a>
        ) : (
          <Link href={exitHref} className={EXIT_LINK}>
            {exitLabel} <ArrowGlyph direction="right" size={10} />
          </Link>
        )
      )}
    </div>
  );
}
