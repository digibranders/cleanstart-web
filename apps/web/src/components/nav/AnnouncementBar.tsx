"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, X } from "lucide-react";
import { trackEvent } from "@/lib/analytics/track";
import {
  ANNOUNCEMENT,
  ANNOUNCEMENT_DISMISSED_ATTR,
  ANNOUNCEMENT_STORAGE_KEY,
  isAnnouncementHidden,
} from "@/lib/announcement";

/**
 * Thin campaign bar above the navbar. It sits in normal flow, so it pushes the
 * whole page down by its height; `HeaderScrollShell` lowers the fixed header
 * by the same amount and docks it to the top as the bar scrolls away. That
 * keeps every hero's header-to-content spacing exactly as designed.
 *
 * Visibility after a dismissal is CSS-driven (see AnnouncementDismissScript),
 * so this renders identically on server and client.
 */
export function AnnouncementBar() {
  const pathname = usePathname();
  if (!ANNOUNCEMENT || isAnnouncementHidden(ANNOUNCEMENT, pathname)) return null;
  const { id, title, shortTitle, detail, cta, href } = ANNOUNCEMENT;

  const onClick = (): void => {
    trackEvent("cta_click", { cta: `announcement_${id}`, page: pathname });
  };

  const onDismiss = (): void => {
    try {
      localStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, id);
    } catch {
      // Storage blocked (private mode, site data off): the bar still hides for this page view.
    }
    document.documentElement.setAttribute(ANNOUNCEMENT_DISMISSED_ATTR, "");
    // The focused button is about to vanish; hand focus to the next control in order.
    document.querySelector<HTMLElement>("header a[href='/']")?.focus();
  };

  return (
    <section className="cs-announce" aria-label="Announcement">
      <Link href={href} onClick={onClick} className="cs-announce-link">
        <span className="cs-announce-tag">New</span>
        <span className="cs-announce-title">
          <span className="sm:hidden">{shortTitle}</span>
          <span className="hidden sm:inline">{title}</span>
        </span>
        <span className="cs-announce-detail">{detail}</span>
        <span className="cs-announce-cta">
          <span className="cs-announce-cta-label">{cta}</span>
          <span className="cs-announce-arrow" aria-hidden="true">
            <ArrowRight className="cs-announce-arrow-icon" strokeWidth={2} />
          </span>
        </span>
      </Link>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss announcement"
        className="cs-announce-close"
      >
        <X aria-hidden="true" className="size-3.5" strokeWidth={2} />
      </button>
    </section>
  );
}
