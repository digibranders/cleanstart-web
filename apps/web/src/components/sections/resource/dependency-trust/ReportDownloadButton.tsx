import type { CSSProperties } from "react";
import { ArrowDownToLine } from "lucide-react";

import { resolveResourceGate } from "@/lib/resource-gate";
import type { ResourceDetail } from "@/lib/resources";

import { ReportGateButton } from "./ReportGate";

interface ReportDownloadButtonProps {
  resource: ResourceDetail;
  label: string;
  /** `glass` reads on the dark bands, `blue` on white. */
  tone: "glass" | "blue";
}

const BUTTON_VARS = {
  "--cs-btn-px": "22px",
  "--cs-btn-fs": "16px",
  "--cs-btn-h": "3rem",
} as CSSProperties;

/**
 * Every call to action on the landing page. Each opens the same gate, the
 * resource's own form, which unlocks a signed download once submitted.
 * `cs-hero-cta` keeps the button at the 44px touch target on mobile, where the
 * global rule would otherwise shrink it to 36px.
 */
export function ReportDownloadButton({
  resource,
  label,
  tone,
}: ReportDownloadButtonProps): React.ReactElement {
  const { gated, gateFormId, assetHref } = resolveResourceGate(resource);
  const className = `cs-btn-${tone} cs-hero-cta gap-2.5`;
  const content = (
    <>
      <span>{label}</span>
      <ArrowDownToLine aria-hidden size={18} strokeWidth={2} />
    </>
  );

  if (!gated || gateFormId === null) {
    return (
      <a
        href={assetHref}
        download={assetHref !== "#"}
        className={className}
        style={BUTTON_VARS}
      >
        {content}
      </a>
    );
  }
  return (
    <ReportGateButton className={className} style={BUTTON_VARS}>
      {content}
    </ReportGateButton>
  );
}
