"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { BlogCtaStage } from "@/lib/blog-cta/types";

/** Reading depth at which the next ask takes over. */
const LEARN_FROM = 0.35;
const PROVE_FROM = 0.75;

interface ArticleBounds {
  top: number;
  height: number;
  viewport: number;
}

export type ProgressListener = (progress: number) => void;
/** Registers a listener for reading progress, 0 to 1. Returns the unsubscribe function. */
export type ProgressSubscribe = (listener: ProgressListener) => () => void;

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
 * level.
 *
 * `stage` is React state that changes only when a threshold is crossed.
 * Continuous values (the progress bar, the tilt that follows scroll) come
 * through `subscribe`, which hands a listener each new value so it can write
 * straight to the DOM without a re-render per frame.
 *
 * Deliberately no animation library: the rest of the site uses only motion's
 * slim `m` component, and the value hooks and springs this once used landed
 * in the chunk every page shares, growing the home page past its bundle
 * budget. One passive scroll listener, coalesced to a frame.
 */
export function useArticleProgress(): { stage: BlogCtaStage; subscribe: ProgressSubscribe } {
  const [stage, setStage] = useState<BlogCtaStage>("explore");
  const listeners = useRef(new Set<ProgressListener>());
  const latest = useRef(0);

  const subscribe = useCallback<ProgressSubscribe>((listener) => {
    listeners.current.add(listener);
    listener(latest.current);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  useEffect(() => {
    const el = document.querySelector<HTMLElement>("[data-article-body]");
    if (!el) return;
    let bounds: ArticleBounds = { top: 0, height: 1, viewport: window.innerHeight };
    let frame = 0;

    const publish = (): void => {
      frame = 0;
      const p = progressAt(window.scrollY, bounds);
      latest.current = p;
      setStage(stageForProgress(p));
      for (const listener of listeners.current) listener(p);
    };
    const onScroll = (): void => {
      if (frame === 0) frame = window.requestAnimationFrame(publish);
    };
    const measure = (): void => {
      const rect = el.getBoundingClientRect();
      bounds = { top: rect.top + window.scrollY, height: Math.max(1, rect.height), viewport: window.innerHeight };
      publish();
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, []);

  return { stage, subscribe };
}
