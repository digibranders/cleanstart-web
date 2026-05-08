'use client';

import { useEffect, type ReactElement } from 'react';

// Versioned content: collections with draft/published lifecycle.
// Sidebar badge shows draft count; list-page header shows two chips
// (DRAFTS + PUBLISHED).
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

// Non-versioned collections that still benefit from an at-a-glance
// total on the list page header. These aren't versioned (no draft
// state) but a TOTAL count surface is helpful for navigation /
// orientation. Sidebar badge is suppressed (only versioned content
// gets the draft tally next to nav links).
const TOTAL_CHIP_CONTENT = [
  'authors',
  'leads',
  'forms',
  'redirects',
  'audit-log',
  'media',
  'aboutGalleries',
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
    // Per slug counter buckets:
    //   - versioned content gets `draft` + `published`
    //   - non-versioned collections (Leads, Forms, Authors, …) get
    //     `total` (the entire row count)
    // Sidebar badge uses `draft` only (versioned). List-page header
    // chips use whichever apply.
    let counts: Record<
      string,
      { draft?: number; published?: number; total?: number }
    > = {};
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
      // Strip stale chips first — covers route changes off a collection
      // list onto an edit / dashboard / global view.
      for (const stale of Array.from(document.querySelectorAll('.cs-list-badge'))) {
        stale.remove();
      }
      if (!slug || !(slug in counts)) return;
      const slugCounts = counts[slug];
      if (!slugCounts) return;

      const draft = slugCounts.draft ?? 0;
      const published = slugCounts.published ?? 0;
      const total = slugCounts.total ?? 0;
      if (draft <= 0 && published <= 0 && total <= 0) return;

      const titleHost =
        document.querySelector('.collection-list h1') ||
        document.querySelector('.list-header h1') ||
        document.querySelector('.gutter h1');
      if (!titleHost || titleHost.parentElement?.querySelector('.cs-list-badge')) {
        return;
      }

      const wrap = document.createElement('span');
      wrap.className = 'cs-list-badge';

      const chips: string[] = [];
      // Versioned collections — show DRAFT + PUBLISHED chips with
      // colour-coded affordances. Each chip filters the list view.
      if (slugCounts.draft != null && draft > 0) {
        const href = `/admin/collections/${slug}?where[_status][equals]=draft`;
        chips.push(
          `<a class="cs-list-badge__chip cs-list-badge__chip--draft" href="${href}" title="Show drafts only">${draft} draft${draft === 1 ? '' : 's'}</a>`,
        );
      }
      if (slugCounts.published != null && published > 0) {
        const href = `/admin/collections/${slug}?where[_status][equals]=published`;
        chips.push(
          `<a class="cs-list-badge__chip cs-list-badge__chip--published" href="${href}" title="Show published only">${published} published</a>`,
        );
      }
      // Non-versioned collections — show a total chip so editors get
      // an at-a-glance count without scrolling for the pagination
      // footer ("1–10 of 247"). Doesn't deeplink anywhere — purely
      // informational.
      if (slugCounts.total != null && total > 0) {
        chips.push(
          `<span class="cs-list-badge__chip cs-list-badge__chip--total" title="Total entries">${total} total</span>`,
        );
      }
      if (chips.length === 0) return;

      wrap.innerHTML = chips.join('');
      titleHost.parentElement?.insertBefore(wrap, titleHost.nextSibling);
    };

    const inject = (): void => {
      if (cancelled) return;
      // Match every `.nav__link`, not just `<a>` — Payload renders the
      // active link as a `<div class="nav__link">` with no href.
      const links = Array.from(document.querySelectorAll<HTMLElement>('.nav__link'));
      for (const link of links) {
        const slug = slugForLink(link);
        if (!slug) continue;
        const count = counts[slug]?.draft ?? 0;
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
      const next: Record<
        string,
        { draft?: number; published?: number; total?: number }
      > = {};
      const fetchCount = async (
        slug: string,
        status?: 'draft' | 'published',
      ): Promise<number> => {
        try {
          const url = new URL(`/api/${slug}`, window.location.origin);
          if (status) url.searchParams.set('where[_status][equals]', status);
          url.searchParams.set('limit', '1');
          url.searchParams.set('depth', '0');
          // `draft: true` is needed so unpublished versioned docs are
          // included in the count. Harmless on non-versioned collections.
          url.searchParams.set('draft', 'true');
          const res = await fetch(url.toString(), { credentials: 'include' });
          if (!res.ok) return 0;
          const json = (await res.json()) as { totalDocs?: number };
          return typeof json?.totalDocs === 'number' ? json.totalDocs : 0;
        } catch {
          return 0;
        }
      };

      // Versioned: parallel draft + published fetches per slug.
      const versionedWork = VERSIONED_CONTENT.map(async (slug) => {
        const [draft, published] = await Promise.all([
          fetchCount(slug, 'draft'),
          fetchCount(slug, 'published'),
        ]);
        next[slug] = { draft, published };
      });

      // Non-versioned: single total fetch per slug.
      const totalWork = TOTAL_CHIP_CONTENT.map(async (slug) => {
        const total = await fetchCount(slug);
        next[slug] = { total };
      });

      await Promise.all([...versionedWork, ...totalWork]);
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
