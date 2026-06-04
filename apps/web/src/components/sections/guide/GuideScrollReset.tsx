"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Force scroll-to-top on every guide-detail mount and whenever the slug
 * changes within the `/guide/[slug]` route. Guards against the App Router
 * occasionally preserving scroll position across dynamic-param transitions
 * (e.g. `/guide/foo` → `/guide/bar` via JourneyNav or RelatedGuides), which
 * would otherwise leave the reader mid-article on the destination guide.
 *
 * Uses `behavior: "auto"` so the reset is invisible. Runs in a `useEffect`,
 * so SSR is unaffected and there is no hydration mismatch.
 */
export function GuideScrollReset(): null {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname == null) return;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}
