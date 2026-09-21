"use client";

import { useRef } from "react";
import { REVEAL_VIEWPORT } from "@/lib/motion";
import { useRevealInView } from "@/components/ui/Reveal";

/**
 * Flags a fingerprint as in view, so its cells can fill in one after another
 * the way a table is read.
 *
 * The cells themselves stay server-rendered and carry their own transition;
 * this leaf only flips `data-inview`, which they read through the `group/fp`
 * variant. One observer per comparison, rather than a motion component per
 * capability row. Reduced motion is handled on the cell with `motion-reduce`,
 * so there is nothing to branch on here.
 */
export function FingerprintReveal({
  className,
  style,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useRevealInView(ref, REVEAL_VIEWPORT);
  return (
    <div
      ref={ref}
      data-inview={inView}
      className={className ? `group/fp ${className}` : "group/fp"}
      style={style}
    >
      {children}
    </div>
  );
}
