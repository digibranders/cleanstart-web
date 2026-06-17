import type { CSSProperties } from "react";

import { cn } from "@/lib/cn";
import { PALETTE } from "./geometry";
import { CheckCircleIcon, ShieldLayersIcon } from "./FlowIcons";

interface ImpactCardProps {
  className?: string;
  /** Caller sets `fontSize` here; all interior sizing is `em`-relative to it. */
  style?: CSSProperties;
}

/**
 * The "Verified Remediation" glass card. Every interior dimension is in
 * `em`, so the caller scales the whole card by setting one `fontSize`.
 */
export function ImpactCard({ className, style }: ImpactCardProps): React.ReactElement {
  return (
    <div
      className={cn(
        "relative flex h-full flex-col items-center justify-between text-center",
        className,
      )}
      style={{
        borderRadius: "0.85em",
        padding: "1.6em 1.1em",
        background:
          "linear-gradient(157deg, rgba(17,23,58,0.92) 0%, rgba(8,11,34,0.96) 100%)",
        border: "1px solid rgba(44,193,235,0.5)",
        boxShadow:
          "0 0 34px rgba(44,193,235,0.18), inset 0 0 26px rgba(44,193,235,0.07)",
        ...style,
      }}
    >
      {/* Shield — top, centred. */}
      <span
        aria-hidden
        className="grid place-items-center"
        style={{
          width: "6em",
          height: "6em",
          color: PALETTE.impact.icon,
          filter: "drop-shadow(0 0 10px rgba(45,224,166,0.6))",
        }}
      >
        <ShieldLayersIcon size="100%" />
      </span>

      {/* Title + divider + result — grouped toward the floor so the title sits
          just above the divider. */}
      <div className="flex w-full flex-col items-center" style={{ gap: "1.05em" }}>
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.1em",
            fontWeight: 600,
            lineHeight: 1.22,
            letterSpacing: "-0.02em",
            color: "#fff",
            textAlign: "center",
            // Cap below the one-line width so "Verified" / "Remediation" wrap to
            // two lines (em keeps it proportional as the card scales).
            maxWidth: "7em",
          }}
        >
          Verified Remediation
        </p>

        <div
          aria-hidden
          style={{
            height: "1px",
            width: "100%",
            background:
              "linear-gradient(90deg, rgba(44,193,235,0) 0%, rgba(44,193,235,0.6) 50%, rgba(44,193,235,0) 100%)",
          }}
        />

        <div className="flex flex-col items-center" style={{ gap: "0.45em" }}>
          <div className="flex items-center justify-center" style={{ gap: "0.5em" }}>
            <span
              aria-hidden
              className="shrink-0"
              style={{
                width: "1.5em",
                height: "1.5em",
                color: "#2CC1EB",
                filter: "drop-shadow(0 0 5px rgba(44,193,235,0.5))",
              }}
            >
              <CheckCircleIcon size="100%" />
            </span>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.92em",
                fontWeight: 600,
                lineHeight: 1.1,
                color: "#fff",
              }}
            >
              Risk reduced
            </span>
          </div>
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.74em",
              lineHeight: 1.25,
              color: "rgba(255,255,255,0.62)",
            }}
          >
            Across affected workloads
          </span>
        </div>
      </div>
    </div>
  );
}
