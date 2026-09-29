"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useScrolled } from "@/components/nav/useScrolled";

// Only the first --cs-announce-h pixels of scroll move the header; anything past
// this cap is equivalent, so writes stop once it is reached.
const DOCK_SCROLL_CAP = 120;

export function HeaderScrollShell({ children }: { children: ReactNode }) {
  const scrolled = useScrolled(24);
  const headerRef = useRef<HTMLElement>(null);

  // Feeds scrollY into `.cs-header-dock` so the header rides down with the
  // announcement bar and docks at top:0 once the bar has scrolled away. Written
  // straight to the element in the scroll handler (which the browser runs just
  // before paint), never through React state.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    let last = -1;
    const write = (): void => {
      const y = Math.min(Math.max(window.scrollY, 0), DOCK_SCROLL_CAP);
      if (y === last) return;
      last = y;
      header.style.setProperty("--cs-announce-scroll", `${y}px`);
    };
    write();
    window.addEventListener("scroll", write, { passive: true });
    window.addEventListener("pageshow", write);
    return () => {
      window.removeEventListener("scroll", write);
      window.removeEventListener("pageshow", write);
    };
  }, []);

  return (
    <header
      ref={headerRef}
      className={`cs-header-dock fixed inset-x-0 z-40 cs-nav-surface pt-[env(safe-area-inset-top)] transition-[background-color,border-color] duration-200 ${
        scrolled ? "cs-nav-shadow" : "cs-nav-surface-top"
      }`}
    >
      <div className="mx-auto flex h-[72px] max-w-[var(--container-default)] items-center justify-between gap-6 ps-[max(1.5rem,env(safe-area-inset-left))] pe-[max(1.5rem,env(safe-area-inset-right))] sm:ps-[max(2.5rem,env(safe-area-inset-left))] sm:pe-[max(2.5rem,env(safe-area-inset-right))]">
        {children}
      </div>
    </header>
  );
}
