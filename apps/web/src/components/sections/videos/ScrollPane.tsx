"use client";

import { createElement, useEffect, useRef } from "react";

const HIDE_AFTER_MS = 900;

interface ScrollPaneProps extends React.HTMLAttributes<HTMLElement> {
  as?: "div" | "section" | "aside";
}

/**
 * A scroll container whose scrollbar only shows while it is being scrolled.
 *
 * The flag is written straight to the element (`data-scrolling`) from its own
 * scroll event and cleared after a short pause, so scrolling never re-renders
 * React. The visual rules live in globals.css under `.cs-autoscroll`.
 */
export function ScrollPane({
  as: Tag = "div",
  className = "",
  children,
  ...rest
}: ScrollPaneProps): React.ReactElement {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer: number | undefined;
    const onScroll = (): void => {
      el.dataset.scrolling = "true";
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        delete el.dataset.scrolling;
      }, HIDE_AFTER_MS);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
    };
  }, []);

  return createElement(Tag, { ref, className: `cs-autoscroll ${className}`, ...rest }, children);
}
