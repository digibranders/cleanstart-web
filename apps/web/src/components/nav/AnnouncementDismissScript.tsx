import {
  ANNOUNCEMENT,
  ANNOUNCEMENT_DISMISSED_ATTR,
  ANNOUNCEMENT_STORAGE_KEY,
} from "@/lib/announcement";

/**
 * Runs in <head> before the body is parsed, so a visitor who dismissed the bar
 * never sees it flash in and the page never shifts up by its height after
 * hydration. Rendered from the root layout rather than the bar itself: an
 * inline script mounted by a client re-render (every soft navigation remounts
 * <Header />) never executes and React warns about it.
 */
export function AnnouncementDismissScript() {
  if (!ANNOUNCEMENT) return null;
  const snippet = `try{if(localStorage.getItem(${JSON.stringify(ANNOUNCEMENT_STORAGE_KEY)})===${JSON.stringify(ANNOUNCEMENT.id)})document.documentElement.setAttribute(${JSON.stringify(ANNOUNCEMENT_DISMISSED_ATTR)},"")}catch(e){}`;
  return (
    <script
      id="announcement-dismissed"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: build-time snippet from constants in lib/announcement.ts (no user input); cleared by script-src 'unsafe-inline' in csp.ts.
      dangerouslySetInnerHTML={{ __html: snippet }}
    />
  );
}
