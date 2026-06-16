import { Fragment } from "react";

import { cn } from "@/lib/cn";
import { FlowBeam } from "@/components/ui/FlowBeam";

/** Lane count — mirrors the six stages / guarantee cards. */
const LANES = [0, 1, 2, 3, 4, 5] as const;

/** Strip height (px). The trust packet travels this distance, from the
 *  lifecycle bar above down onto the guarantee card below. */
const STRIP_H = 64;
const TRAVEL = STRIP_H + 4;

interface VerifyBeamsProps {
  /** Lanes whose trust packet is currently in flight (cascade-driven). */
  flying: ReadonlySet<number>;
  /** Lanes whose persistent dotted "current" is established (stays until reset). */
  dotted: ReadonlySet<number>;
  /** Lanes whose packet just landed this beat (one-shot landing flash). */
  landing: ReadonlySet<number>;
  /** Lane currently hovered (top stage or bottom card), or null. */
  hovered: number | null;
  /** Packet travel time (ms) — kept in sync with the JS master clock. */
  durMs: number;
}

/**
 * The "verification current" between the lifecycle bar and the trust enclosure.
 *
 * The lane columns mirror the guarantee-card grid below (same `justify-between`
 * + `px-10` + 182px columns), so every beam lands dead-centre on its card. The
 * cascade plays one lane at a time: a luminous comet (head + tail) glides down,
 * fires a landing flash as it reaches its card, and then a persistent dashed
 * `FlowBeam` "current" fades in and stays lit for the rest of the cycle —
 * establishing a verified channel from lifecycle stage to guarantee.
 *
 * Decorative; honors reduced-motion (the comet is hidden, the dashed current
 * renders static — see globals.css).
 */
export function VerifyBeams({
  flying,
  dotted,
  landing,
  hovered,
  durMs,
}: VerifyBeamsProps): React.ReactElement {
  return (
    <div aria-hidden className="relative w-full" style={{ height: STRIP_H }}>
      <div className="absolute inset-0 flex flex-nowrap justify-between px-10">
        {LANES.map((i) => {
          const dimmed = hovered !== null && hovered !== i;
          const established = dotted.has(i);
          return (
            <div
              key={i}
              className={cn(
                "relative flex w-[182px] justify-center transition-opacity duration-300",
                dimmed && "cs-sec-dim",
              )}
            >
              {/* Centre column that the beam lives in. */}
              <div className="relative" style={{ width: 4 }}>
                {/* Faint base rail — always present, brightens once established. */}
                <div
                  className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 transition-opacity duration-500"
                  style={{
                    background:
                      "linear-gradient(to bottom, transparent, rgba(150,205,255,0.14), transparent)",
                    opacity: established ? 0 : 1,
                  }}
                />

                {/* Persistent dashed "current" — the established channel. */}
                {established && (
                  <div className="cs-sec-thread absolute inset-y-0 left-1/2 -translate-x-1/2">
                    <FlowBeam
                      className="h-full"
                      style={{ ["--beam-delay" as string]: `${i * 0.12}s` }}
                    />
                  </div>
                )}

                {/* Trust packet — comet head + trailing tail. */}
                {flying.has(i) && (
                  <Fragment>
                    <div
                      className="cs-sec-packet absolute left-1/2 top-0"
                      style={
                        {
                          "--travel": `${TRAVEL}px`,
                          "--dur": `${durMs}ms`,
                        } as React.CSSProperties
                      }
                    >
                      {/* tail */}
                      <div
                        className="absolute"
                        style={{
                          left: -1.5,
                          top: -34,
                          width: 3,
                          height: 38,
                          borderRadius: 3,
                          background:
                            "linear-gradient(180deg, rgba(150,225,255,0) 0%, rgba(170,232,255,0.6) 100%)",
                          mixBlendMode: "screen",
                        }}
                      />
                      {/* head */}
                      <div
                        className="absolute"
                        style={{
                          left: -3.5,
                          top: -3.5,
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background:
                            "radial-gradient(circle, rgba(230,247,255,1) 0%, rgba(170,230,255,0.95) 45%, rgba(150,220,255,0) 75%)",
                          boxShadow:
                            "0 0 16px 4px rgba(150,220,255,0.9), 0 0 5px 1px rgba(230,247,255,0.95)",
                          mixBlendMode: "screen",
                        }}
                      />
                    </div>
                  </Fragment>
                )}

                {/* Landing flash — a soft burst where the packet meets its card. */}
                {landing.has(i) && (
                  <div
                    className="cs-sec-land absolute left-1/2 -translate-x-1/2"
                    style={{
                      bottom: -10,
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      background:
                        "radial-gradient(circle, rgba(190,235,255,0.9) 0%, rgba(140,210,255,0) 70%)",
                      mixBlendMode: "screen",
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
