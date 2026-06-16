import { cn } from "@/lib/cn";

/** Column centres for the six lanes (matches the 6-up justify-between grid). */
export const BEAM_X = ["9%", "25.4%", "41.8%", "58.2%", "74.6%", "91%"] as const;

interface VerifyBeamsProps {
  /** Lane currently hovered (top stage or bottom shield), or null. */
  hovered: number | null;
}

/**
 * The "verification current" — six thick dashed beams between the lifecycle bar
 * and the trust enclosure. Each beam's dashes flow downward on a staggered loop
 * (animated `background-position`), reading as current carried from each risk
 * stage into its guarantee. Driven by `.cs-sec-anim`; hover dims other lanes.
 * lg-only (the rows stack below lg).
 */
export function VerifyBeams({ hovered }: VerifyBeamsProps): React.ReactElement {
  return (
    <div aria-hidden className="relative hidden h-[46px] overflow-hidden lg:block">
      {BEAM_X.map((x, i) => {
        const dimmed = hovered !== null && hovered !== i;
        return (
          <div
            key={x}
            className={cn(
              "cs-sec-beam absolute inset-y-0 -translate-x-1/2",
              dimmed ? "cs-sec-dim" : "cs-sec-lit",
            )}
            style={{
              left: x,
              width: "4px",
              borderRadius: "4px",
              ["--ld" as string]: `${i * 0.1}s`,
              ["--cs-beam-period" as string]: "18px",
              backgroundImage:
                "repeating-linear-gradient(180deg, rgba(130,225,255,0) 0px, rgba(130,225,255,0.95) 4px, rgba(130,225,255,0.95) 9px, rgba(130,225,255,0) 13px, rgba(130,225,255,0) 18px)",
              boxShadow: "0 0 9px rgba(120,220,255,0.7)",
              mixBlendMode: "screen",
            }}
          />
        );
      })}
    </div>
  );
}
