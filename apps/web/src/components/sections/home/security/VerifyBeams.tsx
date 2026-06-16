import { cn } from "@/lib/cn";
import { FlowBeam } from "@/components/ui/FlowBeam";

/** Column centres for the six lanes (matches the 6-up justify-between grid). */
export const BEAM_X = ["9%", "25.4%", "41.8%", "58.2%", "74.6%", "91%"] as const;

interface VerifyBeamsProps {
  /** Lane currently hovered (top stage or bottom shield), or null. */
  hovered: number | null;
}

/**
 * The "verification current" — six thick dashed beams between the lifecycle bar
 * and the trust enclosure, each flowing downward (see FlowBeam). Lanes are
 * phase-offset for life; hover dims the other lanes.
 */
export function VerifyBeams({ hovered }: VerifyBeamsProps): React.ReactElement {
  return (
    <div aria-hidden className="relative block h-[46px] overflow-hidden">
      {BEAM_X.map((x, i) => {
        const dimmed = hovered !== null && hovered !== i;
        return (
          <FlowBeam
            key={x}
            className={cn(
              "absolute inset-y-0 -translate-x-1/2",
              dimmed ? "cs-sec-dim" : "cs-sec-lit",
            )}
            style={{ left: x, ["--beam-delay" as string]: `${i * 0.1}s` }}
          />
        );
      })}
    </div>
  );
}
