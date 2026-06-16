"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/cn";

// useLayoutEffect warns during SSR; fall back to useEffect on the server so the
// first measured paint still happens before the browser shows the unscaled box.
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

type ScaleToFitProps = {
  /** The natural (desktop) width the children are laid out at, in px. */
  designWidth: number;
  children: ReactNode;
  className?: string;
};

/**
 * Renders `children` at a fixed `designWidth` and uniformly scales the whole
 * subtree down to fit the available width — so the layout stays pixel-identical
 * to desktop at every viewport (no reflow, no stacking), just fluidly smaller.
 * Never scales above 1. The wrapper reserves the scaled height so surrounding
 * content flows correctly.
 */
export function ScaleToFit({
  designWidth,
  children,
  className,
}: ScaleToFitProps): React.ReactElement {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>(undefined);

  const measure = useCallback(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const available = outer.clientWidth;
    const next = Math.min(1, available / designWidth);
    setScale(next);
    setHeight(inner.offsetHeight * next);
  }, [designWidth]);

  useIsoLayoutEffect(() => {
    measure();
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const ro = new ResizeObserver(measure);
    ro.observe(outer);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [measure]);

  return (
    <div ref={outerRef} className={cn("relative w-full", className)} style={{ height }}>
      <div
        ref={innerRef}
        className="absolute left-1/2 top-0"
        style={{
          width: designWidth,
          transformOrigin: "top center",
          transform: `translateX(-50%) scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
