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

// Map from sidebar label → collection slug. The active sidebar link
// renders as `<div class="nav__link">` (no href) on its own collection
// page, so when href-based slug lookup fails we fall back to
// matching the inner `.nav__link-label` text against this map.
const SLUG_BY_LABEL: Record<string, (typeof VERSIONED_CONTENT)[number]> = {
  Blogs: 'blogs',
  News: 'news',
  Guides: 'guides',
  Resources: 'resources',
  'Knowledge Hub': 'knowledgeBase',
  'Knowledge base': 'knowledgeBase',
  Events: 'events',
  Webinars: 'webinars',
  Jobs: 'jobs',
  Pages: 'pages',
};

const collectionFromHref = (href: string): string | null => {
  const m = href.match(/\/admin\/collections\/([^/?#]+)/);
  return m?.[1] ?? null;
};

/**
 * Mounts globally via `admin.components.actions` and renders nothing.
 * On mount + every 60s it fetches draft counts for every versioned
 * content collection, then DOM-injects:
 *
 *   1. a `.cs-nav-badge` span into the matching sidebar `.nav__link`
 *      (live tally next to each collection — survives the active
 *      link being a `<div>` with no href, fallback resolves slug
 *      from the `.nav__link-label` text);
 *   2. a `.cs-list-badge` chip into the collection list page's
 *      header so the same draft count is visible on-page, not just
 *      glance-able via the sidebar.
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

    const slugForLink = (link: Element): string | null => {
      // <a> with href — derive slug from URL
      const href = link.getAttribute('href');
      if (href) return collectionFromHref(href);
      // <div> active link (current page has no href) — match inner label
      const label = link
        .querySelector('.nav__link-label')
        ?.textContent?.trim();
      if (label && label in SLUG_BY_LABEL) {
        return SLUG_BY_LABEL[label] ?? null;
      }
      return null;
    };

    const injectListBadge = (): void => {
      if (cancelled) return;
      const m = window.location.pathname.match(/^\/admin\/collections\/([^/?#]+)\/?$/);
      const slug = m?.[1] ?? null;
      // Strip any stale list badge first — covers route changes off a
      // collection list onto an edit / dashboard / global view.
      for (const stale of Array.from(document.querySelectorAll('.cs-list-badge'))) {
        stale.remove();
      }
      if (!slug || !(slug in counts)) return;
      const count = counts[slug];
      if (typeof count !== 'number' || count <= 0) return;

      // Mount next to the list page's h1 title. Payload's structure is
      // `.collection-list h1` or `.list-header h1`; we mount inside
      // the closest header container so flex / wrap behaviour stays
      // sane. Skip if a badge is already there (idempotent).
      const titleHost =
        document.querySelector('.collection-list h1') ||
        document.querySelector('.list-header h1') ||
        document.querySelector('.gutter h1');
      if (!titleHost || titleHost.parentElement?.querySelector('.cs-list-badge')) {
        return;
      }
      const badge = document.createElement('span');
      badge.className = 'cs-list-badge';
      const href = `/admin/collections/${slug}?where[_status][equals]=draft`;
      badge.innerHTML = `<a href="${href}" title="Show drafts only">${count} draft${count === 1 ? '' : 's'}</a>`;
      titleHost.parentElement?.insertBefore(badge, titleHost.nextSibling);
    };

    const inject = (): void => {
      if (cancelled) return;
      // Match every `.nav__link`, not just `<a>` — Payload renders the
      // active link as a `<div class="nav__link">` with no href.
      const links = Array.from(document.querySelectorAll<HTMLElement>('.nav__link'));
      for (const link of links) {
        const slug = slugForLink(link);
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
      injectListBadge();
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
      for (const el of Array.from(
        document.querySelectorAll('.cs-nav-badge, .cs-list-badge'),
      )) {
        el.remove();
      }
    };
  }, []);

  return null;
};

export default NavBadges;
