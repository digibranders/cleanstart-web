"use client";

import { type MotionValue, useMotionValue, useMotionValueEvent, useScroll } from "motion/react";
import { useEffect, useRef, useState } from "react";

import type { BlogCtaStage } from "@/lib/blog-cta/types";

/** Reading depth at which the next ask takes over. */
const LEARN_FROM = 0.35;
const PROVE_FROM = 0.75;

interface ArticleBounds {
  top: number;
  height: number;
  viewport: number;
}

function progressAt(y: number, { top, height, viewport }: ArticleBounds): number {
  return Math.min(1, Math.max(0, (y + viewport * 0.5 - top) / height));
}

export function stageForProgress(progress: number): BlogCtaStage {
  if (progress >= PROVE_FROM) return "prove";
  if (progress >= LEARN_FROM) return "learn";
  return "explore";
}

/**
 * How far through the article body the reader is, 0 to 1, measured at the
 * middle of the viewport so a section counts as read once it reaches eye
 * level. `progress` is a motion value (no re-render per frame); `stage` is
 * React state that only changes when a threshold is crossed.
 */
export function useArticleProgress(): { progress: MotionValue<number>; stage: BlogCtaStage } {
  const { scrollY } = useScroll();
  const progress = useMotionValue(0);
  const [stage, setStage] = useState<BlogCtaStage>("explore");
  const bounds = useRef<ArticleBounds>({ top: 0, height: 1, viewport: 800 });

  useEffect(() => {
    const el = document.querySelector<HTMLElement>("[data-article-body]");
    if (!el) return;
    const measure = (): void => {
      const rect = el.getBoundingClientRect();
      bounds.current = {
        top: rect.top + window.scrollY,
        height: Math.max(1, rect.height),
        viewport: window.innerHeight,
      };
      progress.set(progressAt(window.scrollY, bounds.current));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [progress]);

  useMotionValueEvent(scrollY, "change", (y) => progress.set(progressAt(y, bounds.current)));
  useMotionValueEvent(progress, "change", (p) => setStage(stageForProgress(p)));

  return { progress, stage };
}
