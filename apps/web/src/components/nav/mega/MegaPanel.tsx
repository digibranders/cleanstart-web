import type { CSSProperties, ReactNode } from "react";

type Props = {
  width: number;
  /** Large panel title — e.g. "Products". */
  title: string;
  /** One-line subtitle under the title. */
  subtitle: string;
  /**
   * Brand-family atmosphere wash for the top-right corner. Any CSS color string,
   * composited low-opacity via `--cs-atm`. Defaults to the indigo house wash.
   */
  atmosphere?: string;
  children: ReactNode;
};

/**
 * Mega-menu shell (v2 — Figma node 1672:1420). A near-black navy gradient floor
 * with a brand top-edge accent line, a header (title + subtitle + fading
 * hairline divider), then the panel body. Replaces the eyebrow/tagline
 * {@link PanelShell} for the redesigned card-based menus.
 */
export function MegaPanel({ width, title, subtitle, atmosphere, children }: Props) {
  const style: CSSProperties = { width };
  if (atmosphere) {
    (style as Record<string, string>)["--cs-atm"] = atmosphere;
  }
  return (
    <div
      className="cs-mega-panel relative overflow-hidden rounded-[16px] border border-white/[0.08] p-[22px]"
      style={style}
    >
      <div className="px-1">
        <h2 className="text-[22px] font-semibold leading-tight tracking-[-0.01em] text-white">
          {title}
        </h2>
        <p className="mt-1 text-[14px] leading-snug text-white/60">{subtitle}</p>
      </div>
      <div className="cs-mega-divider mt-3 mb-3 h-px w-full" />
      {children}
    </div>
  );
}
