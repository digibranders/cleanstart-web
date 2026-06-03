"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Force scroll-to-top on every blog-detail mount and whenever the slug
 * changes within the `/blogs/[slug]` route. Belt-and-suspenders for the
 * Next.js App Router behavior where dynamic-route param transitions
 * (e.g. `/blogs/foo` → `/blogs/bar` via the JourneyNav or RelatedPosts grid)
 * intermittently preserve scroll position across the navigation — leaving
 * the reader mid-article on the destination post instead of at the hero.
 *
 * Uses `behavior: "auto"` (instant) so the reset is invisible: the user
 * never sees a "snap back" animation. Runs in a `useEffect`, so SSR is
 * unaffected and there is no hydration mismatch.
 */
export function BlogScrollReset(): null {
  const pathname = usePathname();

  useEffect(() => {
    // Reading pathname here gives biome's useExhaustiveDependencies a genuine
    // dependency rather than a bare re-run trigger; the value itself is unused.
    if (pathname == null) return;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}
