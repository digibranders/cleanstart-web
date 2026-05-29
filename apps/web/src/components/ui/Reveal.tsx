"use client";

import {
  LazyMotion,
  domAnimation,
  m,
  useInView,
  useReducedMotion,
  type HTMLMotionProps,
} from "motion/react";
import { type ReactNode, type RefObject, useEffect, useRef, useState } from "react";

import {
  EASE_OUT,
  HEADER_VIEWPORT,
  REVEAL_VIEWPORT,
  staggerChild,
  staggerParent,
} from "@/lib/motion";

type RevealViewport = typeof REVEAL_VIEWPORT | typeof HEADER_VIEWPORT;

/**
 * Fail-open in-view detection. Drives reveals off `useInView`, but if the
 * IntersectionObserver hasn't reported an element that is *already* within the
 * viewport shortly after mount (a race that surfaces on client-side route
 * navigation, leaving content stranded at `opacity:0`), a geometry check
 * reveals it directly. Below-the-fold content is left for the scroll observer,
 * so the scroll-reveal behaviour is preserved.
 */
function useRevealInView(
  ref: RefObject<HTMLElement | null>,
  viewport: RevealViewport,
): boolean {
  const inView = useInView(ref, viewport);
  const [forceShow, setForceShow] = useState(false);

  useEffect(() => {
    if (inView || forceShow) return;
    const id = window.setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      // Any part of the element is within the viewport but the observer never
      // fired — reveal it so data is never permanently hidden.
      if (rect.top < vh && rect.bottom > 0) setForceShow(true);
    }, 200);
    return () => window.clearTimeout(id);
  }, [inView, forceShow, ref]);

  return inView || forceShow;
}

/**
 * Granular scroll-reveal primitive.
 *
 * Use anywhere we want a paragraph, heading, card, or sub-block to fade up as
 * it scrolls into view — much finer-grained than the section-level `FadeUp`.
 * Matches the sample's `anim()` factory exactly:
 *
 *     <Reveal y={30} delay={0.1}><h2>Title</h2></Reveal>
 *
 * Props:
 *  - `y`        — translate offset (default 30 — sample's body content)
 *  - `delay`    — seconds to wait before animating
 *  - `duration` — seconds for the animation (default 0.7)
 *  - `as`       — element to render (default `div`); pass `"span"` for inline
 *  - `header`   — use the section-header viewport margin (-80px instead of -60px)
 *
 * Respects `prefers-reduced-motion` — renders an unwrapped element.
 */
interface RevealProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  y?: number;
  delay?: number;
  duration?: number;
  header?: boolean;
}

export function Reveal({
  children,
  y = 30,
  delay = 0,
  duration = 0.7,
  header = false,
  ...rest
}: RevealProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const show = useRevealInView(ref, header ? HEADER_VIEWPORT : REVEAL_VIEWPORT);

  if (reduce) {
    return (
      <div {...(rest as unknown as React.HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    );
  }

  // `useInView` returns false on the server and first client render, so the
  // SSR markup matches the client's initial state (no hydration mismatch).
  // After mount the observer — or the fail-open fallback — flips `show`.
  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        ref={ref}
        initial={{ opacity: 0, y }}
        animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y }}
        transition={{ duration, delay, ease: EASE_OUT }}
        {...rest}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}

/**
 * Above-the-fold reveal — fires immediately on mount (no IntersectionObserver),
 * matching the sample's hero pattern. Use for hero titles and CTAs.
 */
interface HeroRevealProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  y?: number;
  delay?: number;
  duration?: number;
}

export function HeroReveal({
  children,
  y = 40,
  delay = 0,
  duration = 0.9,
  ...rest
}: HeroRevealProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div {...(rest as unknown as React.HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        initial={{ opacity: 0, y }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration, delay, ease: EASE_OUT }}
        {...rest}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}

/**
 * Stagger container for card grids / lists. Each direct child should be a
 * `RevealItem`. Stagger gap defaults to 80 ms — matches the sample's testimonials.
 */
interface RevealStaggerProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  gap?: number;
  header?: boolean;
}

export function RevealStagger({
  children,
  gap = 0.08,
  header = false,
  ...rest
}: RevealStaggerProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const show = useRevealInView(ref, header ? HEADER_VIEWPORT : REVEAL_VIEWPORT);

  if (reduce) {
    return (
      <div {...(rest as unknown as React.HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        ref={ref}
        initial="hidden"
        animate={show ? "visible" : "hidden"}
        variants={staggerParent(gap)}
        {...rest}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}

/** Item for `RevealStagger`. Inherits the parent's stagger timing. */
interface RevealItemProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
}

export function RevealItem({ children, ...rest }: RevealItemProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div {...(rest as unknown as React.HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <m.div variants={staggerChild} {...rest}>
        {children}
      </m.div>
    </LazyMotion>
  );
}
