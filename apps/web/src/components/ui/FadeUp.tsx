"use client";

import {
  LazyMotion,
  domAnimation,
  m,
  useReducedMotion,
  type HTMLMotionProps,
} from "motion/react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

interface FadeUpProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  /** Delay before the animation starts, in seconds. */
  delay?: number;
  /** Vertical offset to animate from, in pixels. */
  y?: number;
  /** Duration of the animation, in seconds. */
  duration?: number;
  /** Fraction of the element that must be in view before triggering (0-1). */
  amount?: number;
  /** If true, replay the animation each time the element re-enters the viewport. */
  replay?: boolean;
}

// Module-level store: flips to `true` on bfcache restore so every FadeUp on the
// page falls through to the plain-div branch. Avoids the IntersectionObserver
// re-attach problem that left content stuck at opacity 0.
let bfcacheRestored = false;
const bfcacheListeners = new Set<() => void>();

function subscribeBfcache(cb: () => void) {
  bfcacheListeners.add(cb);
  return () => {
    bfcacheListeners.delete(cb);
  };
}

function getBfcacheSnapshot() {
  return bfcacheRestored;
}

function getBfcacheServerSnapshot() {
  return false;
}

if (typeof window !== "undefined") {
  window.addEventListener("pageshow", (event) => {
    if ((event as PageTransitionEvent).persisted) {
      bfcacheRestored = true;
      for (const cb of bfcacheListeners) cb();
    }
  });
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function FadeUp({
  children,
  delay = 0,
  y = 30,
  duration = 0.7,
  amount = 0.05,
  replay = false,
  ...rest
}: FadeUpProps) {
  const reduce = useReducedMotion();
  const restored = useSyncExternalStore(
    subscribeBfcache,
    getBfcacheSnapshot,
    getBfcacheServerSnapshot,
  );
  const ref = useRef<HTMLDivElement | null>(null);
  // Default to `true` so the server-rendered HTML is fully visible. Only when
  // the client has mounted AND confirmed the element is below the fold do we
  // arm the entrance animation. This is what makes FadeUp SSR-safe and
  // bfcache-safe: there is no render path that paints opacity:0 unattended.
  const [skipAnimation, setSkipAnimation] = useState(true);

  useIsomorphicLayoutEffect(() => {
    if (reduce || restored) {
      setSkipAnimation(true);
      return;
    }
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const viewportH =
      window.innerHeight || document.documentElement.clientHeight || 0;
    // If the element's top edge is already in (or above) the viewport at mount,
    // skip animation — it's already visible, no need to animate from opacity 0.
    const alreadyVisible = rect.top < viewportH;
    setSkipAnimation(alreadyVisible);
  }, [reduce, restored]);

  if (reduce || restored || skipAnimation) {
    return (
      <div
        ref={ref}
        {...(rest as unknown as React.HTMLAttributes<HTMLDivElement>)}
      >
        {children}
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        ref={ref}
        initial={{ opacity: 0, y }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: !replay, amount, margin: "0px 0px -60px 0px" }}
        transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
        {...rest}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
