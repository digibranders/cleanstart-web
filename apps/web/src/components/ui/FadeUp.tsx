"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

interface FadeUpProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  /** Delay before the animation starts, in seconds. */
  delay?: number;
  /** Vertical offset to animate from, in pixels. */
  y?: number;
  /** Duration of the animation, in seconds. */
  duration?: number;
  /** Fraction of the element that must be in view before triggering (0-1). */
  amount?: number;
  /** If true, replay the animation each time the element re-enters the viewport. */
  replay?: boolean;
}

export function FadeUp({
  children,
  delay = 0,
  y = 24,
  duration = 0.6,
  amount = 0.2,
  replay = false,
  ...rest
}: FadeUpProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div {...(rest as unknown as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: !replay, amount }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
