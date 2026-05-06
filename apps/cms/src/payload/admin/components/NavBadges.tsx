'use client';

import { useEffect, type ReactElement } from 'react';

const VERSIONED_CONTENT = [
  'blogs',
  'news',
  'guides',
  'resources',
  'knowledgeBase',
  'events',
  'webinars',
  'jobs',
  'pages',
] as const;

const POLL_INTERVAL_MS = 60_000;
const INJECT_INTERVAL_MS = 3_000;

const collectionFromHref = (href: string): string | null => {
  const m = href.match(/\/admin\/collections\/([^/?#]+)/);
  return m?.[1] ?? null;
};

/**
 * Mounts globally via `admin.components.actions` and renders nothing.
 * On mount + every 60s it fetches draft counts for every versioned
 * content collection, then DOM-injects a `.cs-nav-badge` span into the
 * matching `.nav__link` so the editor sees a live draft tally next to
 * each collection in the sidebar without forking Payload's Nav.
 *
 * The injection is idempotent: a `setInterval` re-runs every few
 * seconds with the cached counts so the badges survive Payload's
 * client-side route re-renders without needing a MutationObserver
 * (which is brittle here because the nav DOM is the same target we're
 * mutating — easy to introduce an observer-loop).
 */
export const NavBadges = (): ReactElement | null => {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    let counts: Record<string, number> = {};
    let cancelled = false;

    const inject = (): void => {
      if (cancelled) return;
      const links = Array.from(
        document.querySelectorAll<HTMLAnchorElement>('.nav__link[href]'),
      );
      for (const link of links) {
        const href = link.getAttribute('href') ?? '';
        const slug = collectionFromHref(href);
        if (!slug) continue;
        const count = counts[slug] ?? 0;
        let badge = link.querySelector<HTMLSpanElement>(':scope > .cs-nav-badge');
        if (count > 0) {
          if (!badge) {
            badge = document.createElement('span');
            badge.className = 'cs-nav-badge';
            link.appendChild(badge);
          }
          const text = String(count);
          if (badge.textContent !== text) badge.textContent = text;
          badge.title = `${count} draft${count === 1 ? '' : 's'} pending`;
        } else if (badge) {
          badge.remove();
        }
      }
    };

    const fetchAndInject = async (): Promise<void> => {
      const next: Record<string, number> = {};
      await Promise.all(
        VERSIONED_CONTENT.map(async (slug) => {
          try {
            const url = new URL(
              `/api/${slug}`,
              window.location.origin,
            );
            url.searchParams.set('where[_status][equals]', 'draft');
            url.searchParams.set('limit', '1');
            url.searchParams.set('depth', '0');
            url.searchParams.set('draft', 'true');
            const res = await fetch(url.toString(), {
              credentials: 'include',
            });
            if (!res.ok) return;
            const json = (await res.json()) as { totalDocs?: number };
            next[slug] = typeof json?.totalDocs === 'number' ? json.totalDocs : 0;
          } catch {
            // Silently skip — badges degrade to no-show on this poll.
          }
        }),
      );
      if (cancelled) return;
      counts = next;
      inject();
    };

    void fetchAndInject();
    const fetchTimer = window.setInterval(() => {
      void fetchAndInject();
    }, POLL_INTERVAL_MS);
    // Re-inject more frequently so the badges survive route re-renders
    // (Payload's nav re-mounts on some navigations). Idempotent + cheap.
    const injectTimer = window.setInterval(inject, INJECT_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(fetchTimer);
      window.clearInterval(injectTimer);
      // Strip any badges we left behind so a hot-module-reload doesn't
      // duplicate them on remount.
      for (const el of Array.from(document.querySelectorAll('.cs-nav-badge'))) {
        el.remove();
      }
    };
  }, []);

  return null;
};

export default NavBadges;
