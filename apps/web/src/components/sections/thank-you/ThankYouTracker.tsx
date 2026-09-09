"use client";

import { useEffect } from "react";

import { claimConversion } from "@/lib/analytics/conversion-handoff";
import { trackEvent } from "@/lib/analytics/track";
import type { ThankYouType } from "@/lib/thank-you/types";

/**
 * Fires the conversion event, but only when the handoff proves this page was
 * reached by a real submission. A refresh, a pasted URL or a crawler renders
 * the page and fires nothing.
 *
 * Also moves focus to the heading. A soft navigation does not move focus or
 * announce anything on its own, and the inline `role="status"` banner this
 * page replaces did announce, so without this the redirect would be a
 * regression for screen reader users.
 *
 * Kept separate from the page so the page itself stays a server component.
 */
export function ThankYouTracker({ type }: { type: ThankYouType }): null {
  useEffect(() => {
    document.getElementById("thank-you-heading")?.focus();

    if (!claimConversion(type)) return;
    // Deferred a tick so the thank-you page_view lands first and the GA4
    // DebugView trace reads in the order a human expects. Attribution is
    // unaffected either way: gtag reads document.location at send time.
    const id = window.setTimeout(() => {
      trackEvent("thank_you_view", { form_name: type });
    }, 0);
    return () => window.clearTimeout(id);
  }, [type]);

  return null;
}
