import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/cn";
import type { StagePalette } from "./geometry";

interface FlowNodeProps {
  palette: StagePalette;
  /** Icon element (coloured via the palette by the caller). */
  children: ReactNode;
  /** Animate the halo with a soft glow pulse. */
  pulse?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * A glowing circular node: pulsing halo, neon ring, dark interior, centred icon.
 * Fills its positioned wrapper — the caller controls size and placement.
 */
export function FlowNode({
  palette,
  children,
  pulse = false,
  className,
  style,
}: FlowNodeProps): React.ReactElement {
  return (
    <div className={cn("relative", className)} style={style}>
      {/* Outer halo — sits behind the ring, optionally pulses. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute rounded-full",
          pulse && "cs-flow-pulse",
        )}
        style={{
          inset: "-22%",
          background: `radial-gradient(circle, ${palette.glow} 0%, transparent 68%)`,
        }}
      />
      {/* Ring + dark interior. */}
      <div
        className="absolute inset-0 grid place-items-center rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 36%, rgba(255,255,255,0.10) 0%, rgba(9,11,38,0.92) 70%)",
          border: `1.5px solid ${palette.ring}`,
          boxShadow: `0 0 26px 0 ${palette.glow}, inset 0 0 18px ${palette.ring}40`,
        }}
      >
        <span
          aria-hidden
          className="grid place-items-center"
          style={{
            width: "46%",
            height: "46%",
            color: palette.icon,
            filter: `drop-shadow(0 0 5px ${palette.glow})`,
          }}
        >
          {children}
        </span>
      </div>
    </div>
  );
}

interface StageLabelProps {
  children: ReactNode;
  palette: StagePalette;
  className?: string;
  style?: CSSProperties;
}

/** Uppercase, letter-spaced stage label with the stage's gradient fill. */
export function StageLabel({
  children,
  palette,
  className,
  style,
}: StageLabelProps): React.ReactElement {
  return (
    <span
      className={cn("inline-block whitespace-nowrap uppercase", className)}
      style={{
        backgroundImage: palette.label,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        fontFamily: "var(--font-sans)",
        fontWeight: 600,
        letterSpacing: "0.09em",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

interface PillProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/** Dark glass chip used for the CVE id and component name. */
export function Pill({ children, className, style }: PillProps): React.ReactElement {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-full",
        className,
      )}
      style={{
        background: "rgba(8, 10, 30, 0.82)",
        border: "1px solid rgba(255, 255, 255, 0.14)",
        color: "rgba(255, 255, 255, 0.92)",
        fontFamily: "var(--font-mono, ui-monospace, monospace)",
        letterSpacing: "-0.01em",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
