"use client";

import { useEffect, useRef } from "react";

/**
 * A soft light that follows the pointer across its parent. It writes the pointer
 * position to two CSS variables once per frame, so it never re-renders React.
 * Touch screens and coarse pointers get nothing.
 */
export function Spotlight({ className }: { className?: string | undefined }): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const light = ref.current;
    const host = light?.parentElement;
    if (!light || !host || !window.matchMedia("(pointer: fine)").matches) return;

    let frame = 0;
    const move = (event: PointerEvent): void => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = host.getBoundingClientRect();
        light.style.setProperty("--mx", `${event.clientX - box.left}px`);
        light.style.setProperty("--my", `${event.clientY - box.top}px`);
      });
    };
    host.addEventListener("pointermove", move);
    return () => {
      host.removeEventListener("pointermove", move);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={ref} aria-hidden className={className} />;
}
