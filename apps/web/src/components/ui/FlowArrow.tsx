import type { CSSProperties } from "react";

import { cn } from "@/lib/cn";

/** Dot pitch in px — MUST match the gradient repeat and the keyframe translate. */
const ARROW_PERIOD = 6;

interface FlowArrowProps {
  /** Layout / placement classes from the caller. */
  className?: string;
  /** Caller styles — `--arrow-delay`, etc. */
  style?: CSSProperties;
  /**
   * Uniform size multiplier. Scaling via `transform` (not px dimensions) keeps
   * the dash period and the keyframe translate in lock-step, so the loop stays
   * seamless at any size. Defaults to 1.
   */
  scale?: number;
}

/**
 * Thin white lifecycle arrow: a fine dotted tail whose dots flow rightward into
 * a static chevron head — the original arrow's look, but the tail is in motion.
 * The dotted track translates by exactly one dot period (transform → seamless,
 * GPU-composited, no jerk) and the wrapper clips the overflow. Honors
 * `prefers-reduced-motion` (static dots).
 */
export function FlowArrow({
  className,
  style,
  scale = 1,
}: FlowArrowProps): React.ReactElement {
  return (
    <div
      aria-hidden
      className={cn("items-center", className)}
      style={{
        gap: "2px",
        ...(scale !== 1 && { transform: `scale(${scale})`, transformOrigin: "center" }),
        ...style,
      }}
    >
      <div className="relative overflow-hidden" style={{ width: "15px", height: "2px" }}>
        <div
          className="cs-flow-arrow"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `-${ARROW_PERIOD}px`,
            right: 0,
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(255,255,255,0) 0px, rgba(255,255,255,0.72) 1px, rgba(255,255,255,0.72) 3px, rgba(255,255,255,0) 4px, rgba(255,255,255,0) 6px)",
          }}
        />
      </div>
      <svg
        width="9"
        height="13"
        viewBox="0 0 9 13"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1.6 1.6 6.7 6.5 1.6 11.4"
          stroke="rgba(255,255,255,0.72)"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
