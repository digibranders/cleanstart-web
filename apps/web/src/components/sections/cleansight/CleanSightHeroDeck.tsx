"use client";

import {
  LazyMotion,
  domAnimation,
  m,
  useReducedMotion,
} from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { EASE_OUT } from "@/lib/motion";

interface DeckCard {
  src: string;
  alt: string;
}

const CARDS: readonly DeckCard[] = [
  {
    src: "/images/cleansight/cs-stack-scan.webp",
    alt: "CleanSight overview dashboard: cluster and image counts, package totals, vulnerability distribution and ecosystem distribution",
  },
  {
    src: "/images/cleansight/cs-stack-detail.webp",
    alt: "CleanSight impact tables ranking the top 5 impacted images and packages by severity and vulnerability count",
  },
  {
    src: "/images/cleansight/cs-stack-results.webp",
    alt: "CleanSight remediation summary: 87.1% vulnerability reduction, 379 vulnerabilities eliminated, and hardened image replacements",
  },
];

const STACK_Y = 16;
const ROTATE_MS = 6500;

// Visual state for each stack position (0 = front). Only transform + opacity
// are animated — both GPU-composited, so the deck never blocks the main thread.
const POSITIONS = [
  { y: 0, scale: 1, opacity: 1, z: 30 },
  { y: -STACK_Y, scale: 0.95, opacity: 0.72, z: 20 },
  { y: -2 * STACK_Y, scale: 0.9, opacity: 0.45, z: 10 },
] as const;

export function CleanSightHeroDeck(): React.ReactElement {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);

  const advance = useCallback(
    () => setActive((a) => (a + 1) % CARDS.length),
    [],
  );

  // Defer the non-LCP dashboard images and the auto-cycle until just after the
  // page settles, so the first (LCP) image is not competing for bandwidth on
  // load and the LCP target stays stable.
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 1500);
    return () => window.clearTimeout(t);
  }, []);

  // Auto-advance. The timer is keyed on `active`, so a manual click (which
  // changes `active`) also resets the countdown before the next auto-advance.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `active` intentionally restarts the timer on every change
  useEffect(() => {
    if (reduce || !ready) return;
    const id = window.setTimeout(advance, ROTATE_MS);
    return () => window.clearTimeout(id);
  }, [active, reduce, ready, advance]);

  return (
    <LazyMotion features={domAnimation} strict>
      <div
        className="relative mx-auto w-full"
        style={{ maxWidth: "600px", paddingTop: `${2 * STACK_Y}px` }}
      >
        <button
          type="button"
          onClick={advance}
          aria-label="Show the next CleanSight dashboard view"
          className="relative block w-full cursor-pointer border-0 bg-transparent p-0"
          style={{ height: "clamp(300px, 40vw, 420px)" }}
        >
          {CARDS.map((card, i) => {
            const pos =
              POSITIONS[(i - active + CARDS.length) % CARDS.length] ?? POSITIONS[0];
            return (
              <m.div
                key={card.src}
                className="absolute inset-0 flex flex-col overflow-hidden"
                style={{
                  zIndex: pos.z,
                  transformOrigin: "center top",
                  borderRadius: "14px",
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgb(10,13,26)",
                  boxShadow:
                    "0 30px 70px -20px rgba(0,0,0,0.65), 0 8px 24px -12px rgba(0,0,0,0.5)",
                }}
                initial={false}
                animate={{
                  y: pos.y,
                  scale: pos.scale,
                  opacity: pos.opacity,
                }}
                transition={{ duration: 1.0, ease: EASE_OUT }}
              >
                <div
                  className="flex items-center gap-[7px] px-4"
                  style={{
                    height: "36px",
                    background: "rgba(17,21,42,0.92)",
                    borderBottom: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <span className="block h-[10px] w-[10px] rounded-full" style={{ background: "#ff5f57" }} />
                  <span className="block h-[10px] w-[10px] rounded-full" style={{ background: "#febc2e" }} />
                  <span className="block h-[10px] w-[10px] rounded-full" style={{ background: "#28c840" }} />
                </div>
                <div className="relative flex-1 overflow-hidden">
                  {(i === 0 || ready) && (
                    <Image
                      src={card.src}
                      alt={card.alt}
                      fill
                      sizes="(min-width: 1024px) 600px, 90vw"
                      priority={i === 0}
                      loading={i === 0 ? undefined : "lazy"}
                      draggable={false}
                      className="select-none object-cover object-top"
                    />
                  )}
                </div>
              </m.div>
            );
          })}
        </button>
      </div>
    </LazyMotion>
  );
}
