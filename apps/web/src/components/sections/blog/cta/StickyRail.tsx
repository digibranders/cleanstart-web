"use client";

import type React from "react";
import { useEffect, useRef } from "react";

const GAP = 24;

/**
 * A sticky column that stays fully reachable when it is taller than the
 * screen. A plain `sticky top-X` pins the top edge, so a rail of three cards
 * on a short laptop hides its last card, the POC, until the article ends.
 * Here the pin point is the lower of "just under the header" and "bottom edge
 * on the screen's bottom edge", re-measured on resize and when the content
 * changes height. No scroll listener: sticky does the following.
 */
export function StickyRail({ children }: { children: React.ReactNode }): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const place = (): void => {
      const header = Number.parseInt(getComputedStyle(document.documentElement).getPropertyValue("--cs-header-h"), 10);
      const underHeader = (Number.isFinite(header) ? header : 72) + GAP;
      el.style.top = `${Math.min(underHeader, window.innerHeight - el.offsetHeight - GAP)}px`;
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(el);
    window.addEventListener("resize", place);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
    };
  }, []);

  return (
    <div ref={ref} className="sticky" style={{ top: "calc(var(--cs-header-h) + 24px)" }}>
      {children}
    </div>
  );
}
