'use client';

import { useEffect, type ReactElement } from 'react';

const TARGET_HREF = '/admin/event-registrations';
const ANCHOR_HREF = '/admin/collections/eventPages';
const LINK_ID = 'cs-nav-event-registrations';
const TICK_MS = 1_000;

/**
 * Places a "Registrations" link in the Marketing nav group, directly under the
 * "Event Registrations" collection link. Payload has no slot for a custom link
 * inside a collection group, so this inserts it into the nav DOM (the same
 * approach as NavBadges). It only appears where the anchor link is rendered,
 * so the departmental role nav scoping carries over.
 */
export const EventRegistrationsNavLink = (): ReactElement | null => {
  useEffect(() => {
    const place = (): void => {
      const anchor = document.querySelector<HTMLElement>(
        `.nav__link[href^="${ANCHOR_HREF}"], a.nav__link[href^="${ANCHOR_HREF}"]`,
      );
      const existing = document.getElementById(LINK_ID);
      if (!anchor) {
        existing?.remove();
        return;
      }
      if (existing && existing.previousElementSibling === anchor) return;
      existing?.remove();

      const active = window.location.pathname.startsWith(TARGET_HREF);
      const link = document.createElement('a');
      link.id = LINK_ID;
      link.href = TARGET_HREF;
      link.className = 'nav__link';
      if (active) link.setAttribute('aria-current', 'page');
      const label = document.createElement('span');
      label.className = 'nav__link-label';
      label.textContent = 'Registrations';
      link.appendChild(label);
      if (active) {
        const indicator = document.createElement('div');
        indicator.className = 'nav__link-indicator';
        link.prepend(indicator);
      }
      anchor.after(link);
    };

    place();
    const timer = window.setInterval(place, TICK_MS);
    return () => {
      window.clearInterval(timer);
      document.getElementById(LINK_ID)?.remove();
    };
  }, []);

  return null;
};
