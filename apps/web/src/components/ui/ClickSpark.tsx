"use client";

import { useEffect, useRef } from "react";

/**
 * Site-wide click-spark effect. A single fixed, non-interactive canvas overlay
 * paints a short spark burst from the cursor on every click.
 *
 * Visibility is guaranteed by compositing, not by guessing the background: the
 * canvas blends with `mix-blend-mode: difference`, so each white spark pixel is
 * painted as the photo-negative of whatever is behind it (black on white, white
 * on near-black, a contrasting tone over the brand color sections). There is no
 * background sampling — no `elementFromPoint`, no `getComputedStyle` per click.
 *
 * Cost profile: no external dependency, a viewport-sized backing store (not the
 * document height), and a lazy rAF loop that runs only while a spark is alive —
 * an idle page does zero per-frame work. Honors `prefers-reduced-motion`, and
 * is disabled on touch-primary devices (phones/tablets) — the canvas is hidden
 * via `pointer-coarse:hidden` and the draw handler bails on a coarse pointer —
 * so the full-viewport blend layer never costs paint/scroll there.
 */

export type SparkEasing = "linear" | "ease-in" | "ease-out" | "ease-in-out";

export interface ClickSparkProps {
  /** Spark line length at burst start, in CSS px. */
  sparkSize?: number;
  /** Distance sparks travel from the origin, in CSS px. */
  sparkRadius?: number;
  /** Number of sparks per click. */
  sparkCount?: number;
  /** Burst lifetime, in ms. */
  duration?: number;
  /** Travel easing. */
  easing?: SparkEasing;
  /** Multiplier applied to `sparkRadius`. */
  extraScale?: number;
  /**
   * Source paint color. White is the correct default: under
   * `mix-blend-mode: difference` it inverts to maximum contrast against any
   * background. Override only for a deliberately tinted blend.
   */
  sparkColor?: string;
}

interface Spark {
  x: number;
  y: number;
  startTime: number;
}

export function ease(easing: SparkEasing, t: number): number {
  switch (easing) {
    case "linear":
      return t;
    case "ease-in":
      return t * t;
    case "ease-in-out":
      return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    default:
      // ease-out
      return 1 - (1 - t) ** 2;
  }
}

export function ClickSpark({
  sparkSize = 8,
  sparkRadius = 15,
  sparkCount = 6,
  duration = 300,
  easing = "ease-out",
  extraScale = 1,
  sparkColor = "#ffffff",
}: ClickSparkProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Touch-primary devices (phones, tablets) get no sparks — the canvas is
    // also hidden via CSS on coarse pointers, so this just skips the work.
    const touchQuery = window.matchMedia("(pointer: coarse)");
    const sparks: Spark[] = [];
    let frameId = 0;
    let resizeFrame = 0;

    const resize = (): void => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now: number): void => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.strokeStyle = sparkColor;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      for (let i = sparks.length - 1; i >= 0; i--) {
        const spark = sparks[i];
        if (!spark) continue;
        const t = (now - spark.startTime) / duration;
        if (t >= 1) {
          sparks.splice(i, 1);
          continue;
        }
        const eased = ease(easing, t);
        const distance = eased * sparkRadius * extraScale;
        const lineLength = sparkSize * (1 - eased);
        ctx.globalAlpha = 1 - eased;
        for (let s = 0; s < sparkCount; s++) {
          const angle = (2 * Math.PI * s) / sparkCount;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          ctx.beginPath();
          ctx.moveTo(spark.x + distance * cos, spark.y + distance * sin);
          ctx.lineTo(
            spark.x + (distance + lineLength) * cos,
            spark.y + (distance + lineLength) * sin,
          );
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      if (sparks.length > 0) {
        frameId = requestAnimationFrame(draw);
      } else {
        frameId = 0;
      }
    };

    const onPointerDown = (event: PointerEvent): void => {
      if (reduceQuery.matches || touchQuery.matches) return;
      sparks.push({
        x: event.clientX,
        y: event.clientY,
        startTime: performance.now(),
      });
      if (frameId === 0) {
        frameId = requestAnimationFrame(draw);
      }
    };

    const onResize = (): void => {
      if (resizeFrame !== 0) return;
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0;
        resize();
      });
    };

    resize();
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", onResize);
      if (frameId !== 0) cancelAnimationFrame(frameId);
      if (resizeFrame !== 0) cancelAnimationFrame(resizeFrame);
    };
  }, [sparkSize, sparkRadius, sparkCount, duration, easing, extraScale, sparkColor]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] mix-blend-difference pointer-coarse:hidden"
    />
  );
}
