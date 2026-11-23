"use client";

import { useRef, useState } from "react";

interface Tip {
  x: number;
  y: number;
  lines: string[];
}

/**
 * Hover and focus tooltip for server-rendered SVG. Any descendant with a `data-tip` attribute ("title\nrow\nrow") gets one.
 * Text is rendered as React text, never as HTML. The tooltip only repeats what the marks' aria-labels and the table view already say.
 */
export function TipHost({ children }: { children: React.ReactNode }): React.JSX.Element {
  const host = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<Tip | null>(null);

  function show(target: EventTarget | null, pointerX?: number): void {
    const el = target instanceof Element ? target.closest("[data-tip]") : null;
    const text = el?.getAttribute("data-tip");
    if (!el || !text || !host.current) {
      setTip(null);
      return;
    }
    const h = host.current.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setTip({ x: (pointerX ?? r.left + r.width / 2) - h.left, y: r.top - h.top, lines: text.split("\n") });
  }

  return (
    <div
      ref={host}
      className="ch-host"
      onPointerMove={(e) => show(e.target, e.clientX)}
      onPointerLeave={() => setTip(null)}
      onFocus={(e) => show(e.target)}
      onBlur={() => setTip(null)}
    >
      {children}
      {tip ? (
        <div className="ch-tip" aria-hidden="true" style={{ left: tip.x, top: tip.y }}>
          {tip.lines.map((line, i) => (
            <div key={i} className={i === 0 ? "ch-tip-t" : "ch-tip-v"}>
              {line}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
