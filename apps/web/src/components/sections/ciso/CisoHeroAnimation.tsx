"use client";

/*
 * Client-only wrapper for the CISO Hero Lottie animation.
 * - Honors prefers-reduced-motion: when reduced, renders a static
 *   poster (frame 0) — no animation, no CPU spin.
 * - The consumer (CisoHero.tsx) wraps this with next/dynamic
 *   `ssr: false` so the lottie-react runtime doesn't ship in the
 *   server bundle.
 */

import Lottie from "lottie-react";
import { useReducedMotion } from "motion/react";
import animationData from "../../../../public/animations/ciso-hero.json";

export function CisoHeroAnimation(): React.ReactElement {
  const reduceMotion = useReducedMotion();

  return (
    <Lottie
      animationData={animationData}
      loop={!reduceMotion}
      autoplay={!reduceMotion}
      style={{ width: "100%", height: "100%" }}
      rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }}
    />
  );
}
