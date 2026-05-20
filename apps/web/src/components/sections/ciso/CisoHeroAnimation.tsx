"use client";

/*
 * Client-only wrapper for the CISO Hero Lottie animation.
 * Loaded eagerly (no lazy) to match Webflow's data-loading="eager".
 * viewBox: 0 0 498 416 — native aspect ratio 498:416 ≈ 1.197:1
 * Duration: 7.5 s, loops indefinitely.
 */

import Lottie from "lottie-react";
import animationData from "../../../../public/animations/ciso-hero.json";

export function CisoHeroAnimation(): React.ReactElement {
  return (
    <Lottie
      animationData={animationData}
      loop
      autoplay
      style={{ width: "100%", height: "100%" }}
      rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }}
    />
  );
}
