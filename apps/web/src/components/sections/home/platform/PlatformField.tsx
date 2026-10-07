"use client";

import { useEffect, useRef } from "react";
import type { FieldHandle } from "./field-engine";

type ConnectionInfo = { saveData?: boolean };

function scheduleIdle(cb: () => void): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(cb, { timeout: 1200 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(cb, 60);
  return () => window.clearTimeout(id);
}

/**
 * Decorative particle backdrop for the home platform section. Renders only a
 * canvas: every word and link on the section is server-rendered, so this island
 * can load late (or never, with Save-Data) without the section changing.
 */
export function PlatformField(): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = canvas?.closest<HTMLElement>("[data-pf-root]");
    if (!canvas || !root) return;

    const connection = (navigator as Navigator & { connection?: ConnectionInfo }).connection;
    if (connection?.saveData) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let handle: FieldHandle | null = null;
    let cancelIdle: (() => void) | null = null;
    let disposed = false;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        cancelIdle = scheduleIdle(() => {
          import("./field-engine")
            .then(({ createField }) => {
              if (disposed) return;
              handle = createField({
                root,
                canvas,
                reducedMotion,
                onReady: () => {
                  canvas.dataset.ready = "true";
                },
              });
            })
            .catch(() => undefined);
        });
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(root);

    return () => {
      disposed = true;
      observer.disconnect();
      cancelIdle?.();
      handle?.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[2] h-full w-full opacity-0 transition-opacity duration-[900ms] data-[ready=true]:opacity-100 motion-reduce:transition-none"
    />
  );
}
