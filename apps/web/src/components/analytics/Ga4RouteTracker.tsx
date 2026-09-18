"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { trackPageView } from "@/lib/analytics/track";

/**
 * Pushes a `page_view` dataLayer event on every client-side navigation, which
 * GTM forwards to GA4 through its `GA4 - page_view` tag.
 *
 * The initial page load is covered by the GTM Google tag's own page_view on
 * Initialization, so the first effect run only records the starting URL and does
 * not emit. Every
 * later pathname/search-params change fires a manual page_view with the
 * post-commit document.title — this replaces GA4 Enhanced Measurement's
 * "history events" tracking, which fires before Next.js swaps the <title> and
 * therefore attributes SPA views to the previous page. Keep that toggle OFF in
 * the GA4 property or navigations double-count.
 *
 * Uses `useSearchParams`, so the parent must mount it inside <Suspense/>.
 */
export function Ga4RouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevUrl = useRef<string | null>(null);

  useEffect(() => {
    const qs = searchParams.toString();
    const url = `${window.location.origin}${pathname}${qs ? `?${qs}` : ""}`;
    if (prevUrl.current === null) {
      prevUrl.current = url;
      return;
    }
    if (prevUrl.current === url) return;
    trackPageView({
      page_location: url,
      page_title: document.title,
      page_referrer: prevUrl.current,
    });
    prevUrl.current = url;
  }, [pathname, searchParams]);

  return null;
}
