"use client";

import {
  LazyMotion,
  domAnimation,
  m,
  useReducedMotion,
  type HTMLMotionProps,
} from "motion/react";
import { type ReactNode, useEffect, useState } from "react";

import {
  EASE_OUT,
  HEADER_VIEWPORT,
  REVEAL_VIEWPORT,
  staggerChild,
  staggerParent,
} from "@/lib/motion";

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
  // Render a static placeholder on the server and first client render, then
  // mount the motion element after hydration. When this element is above the
  // fold, motion resolves the in-view state during the client's first render
  // and disagrees with the server's initial state, causing a hydration
  // mismatch. Keeping motion out of SSR sidesteps that while the freshly
  // mounted whileInView observer still drives the reveal.
  const reduceProps = rest as unknown as React.HTMLAttributes<HTMLDivElement>;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (reduce) {
    return <div {...reduceProps}>{children}</div>;
  }

  if (!mounted) {
    return (
      <div
        {...reduceProps}
        style={{
          opacity: 0,
          transform: `translateY(${y}px)`,
          ...reduceProps.style,
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        initial={{ opacity: 0, y }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={header ? HEADER_VIEWPORT : REVEAL_VIEWPORT}
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
        initial="hidden"
        whileInView="visible"
        viewport={header ? HEADER_VIEWPORT : REVEAL_VIEWPORT}
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
