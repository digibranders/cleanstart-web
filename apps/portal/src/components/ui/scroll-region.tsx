"use client";

import { useEffect, useRef, useState } from "react";
import { FOCUSABLE_SELECTOR } from "@/lib/focus-trap";

/**
 * A horizontally scrolling wrapper for a wide table. A keyboard user can only scroll it when something inside can take
 * focus. When the table is wider than the screen and has no link or button in it (an empty state, a read-only list),
 * the wrapper becomes a labelled, focusable region so the arrow keys still scroll it. Otherwise it adds no tab stop.
 */
export function ScrollRegion({ label, children }: { label: string; children: React.ReactNode }): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const [needsFocus, setNeedsFocus] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = (): void => setNeedsFocus(el.scrollWidth > el.clientWidth && el.querySelector(FOCUSABLE_SELECTOR) === null);
    check();
    const resize = new ResizeObserver(check);
    resize.observe(el);
    const mutation = new MutationObserver(check);
    mutation.observe(el, { childList: true, subtree: true });
    return () => {
      resize.disconnect();
      mutation.disconnect();
    };
  }, []);

  return (
    <div ref={ref} style={{ overflowX: "auto" }} {...(needsFocus ? { tabIndex: 0, role: "region", "aria-label": label } : {})}>
      {children}
    </div>
  );
}
