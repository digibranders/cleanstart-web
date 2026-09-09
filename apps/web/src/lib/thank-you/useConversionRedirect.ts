"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { armConversion } from "@/lib/analytics/conversion-handoff";
import type { ThankYouType } from "./types";

/**
 * Arms the one-shot handoff, then navigates.
 *
 * `router.push` rather than a hard navigation, for two reasons. It is the only
 * option that preserves the in-memory handoff, and both paths already produce
 * exactly one GA4 `page_view` (a hard load from `gtag('config')`, a soft one
 * from Ga4RouteTracker, whose first effect returns early), so neither
 * double-counts and the faster one wins.
 */
export function useConversionRedirect(): (type: ThankYouType) => void {
  const router = useRouter();
  return useCallback(
    (type: ThankYouType) => {
      armConversion(type);
      router.push(`/thank-you/${type}`);
    },
    [router],
  );
}
