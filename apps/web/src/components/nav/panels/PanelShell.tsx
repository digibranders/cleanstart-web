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
      className="overflow-hidden border border-white/[0.06] p-[18px] shadow-[0_18px_50px_-20px_rgba(0,0,0,0.5)]"
      style={{ width, background: "#161126", borderRadius: 16 }}
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
