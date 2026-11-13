"use client";

import { useEffect, useRef, useState } from "react";
import { FOCUSABLE_SELECTOR } from "@/lib/focus-trap";

interface ScrollMetrics {
  scrollLeft: number;
  clientWidth: number;
  scrollWidth: number;
}

/** True while something is still hidden past the right edge. The 1 px slack absorbs fractional scroll positions. */
export function hasMoreToTheRight({ scrollLeft, clientWidth, scrollWidth }: ScrollMetrics): boolean {
  return scrollLeft + clientWidth < scrollWidth - 1;
}

/**
 * A horizontally scrolling wrapper for a wide table. A shadow on the right edge shows while there is more to scroll to.
 * A keyboard user can only scroll it when something inside can take focus. When the table is wider than the screen and
 * has no link or button in it (an empty state, a read-only list), the wrapper becomes a labelled, focusable region so
 * the arrow keys still scroll it. Otherwise it adds no tab stop.
 */
export function ScrollRegion({ label, children }: { label: string; children: React.ReactNode }): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const [needsFocus, setNeedsFocus] = useState(false);
  const [moreToTheRight, setMoreToTheRight] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = (): void => {
      setNeedsFocus(el.scrollWidth > el.clientWidth && el.querySelector(FOCUSABLE_SELECTOR) === null);
      // An open dropdown makes the region overflow: visible, and then nothing is clipped.
      setMoreToTheRight(getComputedStyle(el).overflowX !== "visible" && hasMoreToTheRight(el));
    };
    check();
    const resize = new ResizeObserver(check);
    resize.observe(el);
    if (el.firstElementChild) resize.observe(el.firstElementChild);
    const mutation = new MutationObserver(check);
    mutation.observe(el, { childList: true, subtree: true });
    el.addEventListener("scroll", check, { passive: true });
    return () => {
      resize.disconnect();
      mutation.disconnect();
      el.removeEventListener("scroll", check);
    };
  }, []);

  return (
    <div className="scroll-wrap">
      <div ref={ref} style={{ overflowX: "auto" }} {...(needsFocus ? { tabIndex: 0, role: "region", "aria-label": label } : {})}>
        {children}
      </div>
      <div className="scroll-cue" data-on={moreToTheRight} aria-hidden="true" />
    </div>
  );
}
