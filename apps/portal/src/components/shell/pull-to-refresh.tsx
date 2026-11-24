"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const TRIGGER_PX = 64;
const MAX_PX = 96;
const SPIN_MS = 700;

/**
 * Pull down from the top of a page to reload its data, like a phone app. Touch screens only. It stays out of the way when a sheet is open
 * or a chat is on screen (the thread scrolls on its own), and it only ever refreshes the server data, never the whole page.
 */
export function PullToRefresh(): React.JSX.Element {
  const router = useRouter();
  const [pull, setPull] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const start = useRef<number | null>(null);
  const pullRef = useRef(0);

  useEffect(() => {
    if (!window.matchMedia("(pointer: coarse)").matches) return;
    const blocked = (): boolean => document.querySelector(".cx, .dialog, .drawer, .side-open") !== null;
    const onStart = (event: TouchEvent): void => {
      start.current = window.scrollY <= 0 && !blocked() ? (event.touches[0]?.clientY ?? null) : null;
    };
    const onMove = (event: TouchEvent): void => {
      if (start.current === null) return;
      const delta = (event.touches[0]?.clientY ?? 0) - start.current;
      if (delta <= 0 || window.scrollY > 0) {
        pullRef.current = 0;
        setPull(0);
        return;
      }
      pullRef.current = Math.min(delta * 0.5, MAX_PX);
      setPull(pullRef.current);
    };
    const onEnd = (): void => {
      const reached = pullRef.current >= TRIGGER_PX;
      start.current = null;
      pullRef.current = 0;
      setPull(0);
      if (!reached) return;
      setSpinning(true);
      navigator.vibrate?.(8);
      router.refresh();
      setTimeout(() => setSpinning(false), SPIN_MS);
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [router]);

  const shown = spinning ? TRIGGER_PX * 0.6 : pull;
  return (
    <div className="ptr" aria-hidden="true" style={{ transform: `translateY(${shown}px)`, opacity: shown > 8 ? 1 : 0 }}>
      <span className={`ptr-ring${spinning ? " ptr-spin" : ""}`} style={spinning ? undefined : { transform: `rotate(${pull * 4}deg)` }} />
    </div>
  );
}
