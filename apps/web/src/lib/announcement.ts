/**
 * Site-wide announcement bar rendered above the navbar by `<Header />`.
 * Set `ANNOUNCEMENT` to `null` to take the bar down everywhere.
 */
export interface Announcement {
  /** Dismissals are stored against this id; a new id re-shows the bar to everyone. */
  id: string;
  /** Full title, shown from `sm` up. */
  title: string;
  /** Phone-width title; must fit one line at 320px next to the arrow. */
  shortTitle: string;
  /** Supporting line, shown from `lg` up. */
  detail: string;
  cta: string;
  href: string;
  /** Path prefixes where the bar would advertise the page the visitor is already on. */
  hideOn: readonly string[];
}

export const ANNOUNCEMENT: Announcement | null = {
  id: "ciso-guide-software-trust-2026",
  title: "The 2026 CISO Guide to Software Trust is here",
  shortTitle: "2026 CISO Guide to Software Trust",
  detail: "Build trust across your software supply chain.",
  cta: "Download the guide",
  href: "/resources/ciso-guide-software-trust",
  hideOn: ["/resources/ciso-guide-software-trust", "/thank-you"],
};

export const ANNOUNCEMENT_STORAGE_KEY = "cs-announcement-dismissed";

/** Set on `<html>` before first paint when the current announcement was dismissed. */
export const ANNOUNCEMENT_DISMISSED_ATTR = "data-announcement-dismissed";

export function isAnnouncementHidden(announcement: Announcement, pathname: string): boolean {
  return announcement.hideOn.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
