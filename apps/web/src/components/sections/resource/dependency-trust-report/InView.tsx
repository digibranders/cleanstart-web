"use client";

import { useEffect, useRef, useState } from "react";

type RevealState = "static" | "waiting" | "in";

interface InViewProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * Wraps a picture and reports when it first scrolls into view through
 * `data-state`. Server HTML and reduced-motion visitors stay in `static`, which
 * the CSS treats as the finished picture. Only after hydration, and only if the
 * picture is not yet on screen, does it go to `waiting` and then `in`, so the
 * reveal plays once and costs one state change, not one per frame.
 */
export function InView({ className, children }: InViewProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<RevealState>("static");

  useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    setState("waiting");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setState("in");
        observer.disconnect();
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} data-state={state} className={className}>
      {children}
    </div>
  );
}
