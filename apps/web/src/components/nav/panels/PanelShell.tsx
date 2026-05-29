import type { ReactNode } from "react";
import { PanelHeader, type Accent } from "@/components/nav/pieces/PanelHeader";

type Props = {
  width: number;
  accent: Accent;
  eyebrow: string;
  tagline: string;
  exitHref?: string;
  exitLabel?: string;
  children: ReactNode;
};

export function PanelShell({ width, accent, eyebrow, tagline, exitHref, exitLabel, children }: Props) {
  return (
    <div
      className="cs-panel-glass overflow-hidden border border-white/[0.08] p-[18px]"
      style={{ width, borderRadius: 18 }}
    >
      <PanelHeader
        eyebrow={eyebrow}
        tagline={tagline}
        accent={accent}
        {...(exitHref && exitLabel ? { exitHref, exitLabel } : {})}
      />
      <div className="mt-3.5">{children}</div>
    </div>
  );
}
