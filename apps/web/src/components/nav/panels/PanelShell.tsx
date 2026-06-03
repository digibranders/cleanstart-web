import type { CSSProperties, ReactNode } from "react";
import { PanelHeader } from "@/components/nav/pieces/PanelHeader";

type Props = {
  width: number;
  eyebrow: string;
  tagline: string;
  exitHref?: string;
  exitLabel?: string;
  /**
   * Brand-family atmosphere wash for this menu's floor. Any CSS color string —
   * composited at low opacity in the top-right corner via `--cs-atm`. Omit for
   * a plain floor.
   */
  atmosphere?: string;
  children: ReactNode;
};

export function PanelShell({
  width,
  eyebrow,
  tagline,
  exitHref,
  exitLabel,
  atmosphere,
  children,
}: Props) {
  const style: CSSProperties = { width, borderRadius: 16 };
  if (atmosphere) {
    (style as Record<string, string>)["--cs-atm"] = atmosphere;
  }
  return (
    <div
      className="cs-panel-glass overflow-hidden border border-white/[0.06] p-[18px]"
      style={style}
    >
      <PanelHeader
        eyebrow={eyebrow}
        tagline={tagline}
        {...(exitHref && exitLabel ? { exitHref, exitLabel } : {})}
      />
      <div className="mt-3.5">{children}</div>
    </div>
  );
}
