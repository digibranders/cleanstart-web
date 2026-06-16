import type { CSSProperties } from "react";

import { cn } from "@/lib/cn";

/** Dash period in px — MUST match the gradient repeat and the keyframe translate. */
const BEAM_PERIOD = 18;

interface FlowBeamProps {
  /** Positioning / state classes from the caller (e.g. absolute placement, dim). */
  className?: string;
  /** Caller styles — `left`, `--beam-delay`, width override, etc. */
  style?: CSSProperties;
  /**
   * Reverse the flow so the dashes travel upward instead of downward. The dash
   * pattern is periodic, so reversing stays seamless; `prefers-reduced-motion`
   * still wins (its `animation: none !important` disables either direction).
   */
  reverse?: boolean;
}

/**
 * Vertical "current" beam: a thick dashed cyan line whose dashes flow downward
 * (or upward, with `reverse`) on a seamless loop. The dashed track is translated
 * by exactly one dash period and the wrapper clips the overflow, so the loop has
 * no visible seam; using `transform` (not `background-position`) keeps it
 * GPU-composited and jank-free. Shared by the home Platform pipeline and the
 * Security section. Honors `prefers-reduced-motion` (renders a static dashed beam).
 */
export function FlowBeam({
  className,
  style,
  reverse = false,
}: FlowBeamProps): React.ReactElement {
  return (
    <div
      aria-hidden
      className={cn("relative overflow-hidden", className)}
      style={{ width: "4px", ...style }}
    >
      <div
        className="cs-flow-beam"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: `-${BEAM_PERIOD}px`,
          bottom: 0,
          borderRadius: "4px",
          backgroundImage:
            "repeating-linear-gradient(180deg, rgba(130,225,255,0) 0px, rgba(130,225,255,0.95) 4px, rgba(130,225,255,0.95) 9px, rgba(130,225,255,0) 13px, rgba(130,225,255,0) 18px)",
          boxShadow: "0 0 9px rgba(120,220,255,0.7)",
          mixBlendMode: "screen",
          ...(reverse ? { animationDirection: "reverse" } : null),
        }}
      />
    </div>
  );
}
