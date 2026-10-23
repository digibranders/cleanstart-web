"use client";

import { useEffect, useRef, useState } from "react";

interface ExpandableBoxProps {
  children: React.ReactNode;
  /** Height in px shown before "Show more". */
  collapsedHeight?: number;
}

/**
 * Clamps long content like YouTube's description box. The full text stays in
 * the DOM and the HTML, only clipped, so crawlers and screen readers get all of
 * it; the button only appears when something is actually hidden.
 */
export function ExpandableBox({
  children,
  collapsedHeight = 120,
}: ExpandableBoxProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = (): void => setOverflowing(el.scrollHeight > collapsedHeight + 8);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [collapsedHeight]);

  const clipped = overflowing && !open;
  return (
    <div>
      <div
        ref={ref}
        className="overflow-hidden"
        style={{
          ...(open ? {} : { maxHeight: collapsedHeight }),
          ...(clipped
            ? {
                maskImage: "linear-gradient(180deg, #000 60%, transparent)",
                WebkitMaskImage: "linear-gradient(180deg, #000 60%, transparent)",
              }
            : {}),
        }}
      >
        {children}
      </div>
      {overflowing ? (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="mt-3 inline-flex h-10 cursor-pointer items-center font-sans text-[14px] font-semibold text-white underline-offset-4 hover:underline"
        >
          {open ? "Show less" : "Show more"}
        </button>
      ) : null}
    </div>
  );
}
