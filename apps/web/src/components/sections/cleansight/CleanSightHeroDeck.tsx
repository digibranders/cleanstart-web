"use client";

import {
  LazyMotion,
  domAnimation,
  m,
  useReducedMotion,
} from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";
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
const ROTATE_MS = 3800;

// Visual state for each stack position (0 = front).
const POSITIONS = [
  { y: 0, scale: 1, opacity: 1, blur: 0, z: 30 },
  { y: -STACK_Y, scale: 0.95, opacity: 0.72, blur: 2, z: 20 },
  { y: -2 * STACK_Y, scale: 0.9, opacity: 0.45, blur: 3.5, z: 10 },
] as const;

export function CleanSightHeroDeck(): React.ReactElement {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(
      () => setActive((a) => (a + 1) % CARDS.length),
      ROTATE_MS,
    );
    return () => window.clearInterval(id);
  }, [reduce]);

  return (
    <LazyMotion features={domAnimation} strict>
      <div
        className="relative mx-auto w-full"
        style={{ maxWidth: "600px", paddingTop: `${2 * STACK_Y}px` }}
      >
        <div
          className="relative"
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
                  filter: `blur(${pos.blur}px)`,
                }}
                transition={{ duration: 0.7, ease: EASE_OUT }}
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
                </div>
              </m.div>
            );
          })}
        </div>
      </div>
    </LazyMotion>
  );
}
