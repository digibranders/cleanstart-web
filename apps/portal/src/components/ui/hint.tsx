"use client";

import { useEffect, useState } from "react";

interface Hint {
  text: string;
  x: number;
  y: number;
}

/**
 * One tooltip for the whole app, in place of the browser's title bubble. Any element with a `data-hint` attribute gets it on
 * hover and keyboard focus. Mount once in the root layout. The text is React text, never HTML, and the element keeps its own
 * aria-label or visible text for screen readers, so the hint only repeats what they already say.
 */
export function HintHost(): React.JSX.Element | null {
  const [hint, setHint] = useState<Hint | null>(null);

  useEffect(() => {
    const show = (target: EventTarget | null): void => {
      const el = target instanceof Element ? target.closest("[data-hint]") : null;
      const text = el?.getAttribute("data-hint");
      if (!el || !text) {
        setHint(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setHint({ text, x: r.left + r.width / 2, y: r.top });
    };
    const hide = (): void => setHint(null);
    const over = (e: Event): void => show(e.target);
    document.addEventListener("pointerover", over);
    document.addEventListener("focusin", over);
    document.addEventListener("pointerdown", hide);
    document.addEventListener("scroll", hide, true);
    document.addEventListener("focusout", hide);
    return () => {
      document.removeEventListener("pointerover", over);
      document.removeEventListener("focusin", over);
      document.removeEventListener("pointerdown", hide);
      document.removeEventListener("scroll", hide, true);
      document.removeEventListener("focusout", hide);
    };
  }, []);

  if (!hint) return null;
  return (
    <div className="hint-tip" aria-hidden="true" style={{ left: hint.x, top: hint.y }}>
      {hint.text}
    </div>
  );
}
