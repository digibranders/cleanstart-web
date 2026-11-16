import type { CSSProperties } from "react";
import { ArrowDownToLine, ArrowRight } from "lucide-react";

import { ReportGateButton } from "../dependency-trust/ReportGate";

interface ReportButtonProps {
  label: string;
  /** `glass` reads on the dark bands, `blue` on white. */
  tone: "glass" | "blue";
  /** `arrow` for a button that leads on to the report rather than naming the download. */
  icon?: "download" | "arrow";
}

const BUTTON_VARS = {
  "--cs-btn-px": "22px",
  "--cs-btn-fs": "16px",
  "--cs-btn-h": "3rem",
} as CSSProperties;

/**
 * Every call to action on the landing page. Each opens the same gate, the
 * report's own form, which unlocks a signed download once submitted.
 * `cs-hero-cta` keeps the button at the 44px touch target on mobile, where the
 * global rule would otherwise shrink it to 36px.
 */
export function ReportButton({ label, tone, icon = "download" }: ReportButtonProps): React.ReactElement {
  const Icon = icon === "arrow" ? ArrowRight : ArrowDownToLine;
  return (
    <ReportGateButton className={`cs-btn-${tone} cs-hero-cta gap-2.5`} style={BUTTON_VARS}>
      <span>{label}</span>
      <Icon aria-hidden size={18} strokeWidth={2} />
    </ReportGateButton>
  );
}
