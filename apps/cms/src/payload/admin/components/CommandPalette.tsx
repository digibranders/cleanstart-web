'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from 'react';

type Action = {
  id: string;
  label: string;
  hint?: string;
  href: string;
  group: 'navigate' | 'create' | 'document' | 'recent';
  icon?: 'home' | 'collection' | 'plus' | 'doc' | 'clock';
};

type DocHit = {
  id: string | number;
  title: string;
  collection: string;
  collectionLabel: string;
  href: string;
};

const NAV_TARGETS: Array<Omit<Action, 'group'>> = [
  { id: 'nav-dashboard', label: 'Dashboard', href: '/admin', icon: 'home' },
  { id: 'nav-media', label: 'Media library', href: '/admin/collections/media', icon: 'collection' },
  { id: 'nav-blogs', label: 'Blogs', href: '/admin/collections/blogs', icon: 'collection' },
  { id: 'nav-news', label: 'News', href: '/admin/collections/news', icon: 'collection' },
  { id: 'nav-guides', label: 'Guides', href: '/admin/collections/guides', icon: 'collection' },
  { id: 'nav-resources', label: 'Resources', href: '/admin/collections/resources', icon: 'collection' },
  { id: 'nav-knowledgeBase', label: 'Knowledge Hub', href: '/admin/collections/knowledgeBase', icon: 'collection' },
  { id: 'nav-events', label: 'Events', href: '/admin/collections/events', icon: 'collection' },
  { id: 'nav-webinars', label: 'Webinars', href: '/admin/collections/webinars', icon: 'collection' },
  { id: 'nav-jobs', label: 'Jobs', href: '/admin/collections/jobs', icon: 'collection' },
  { id: 'nav-aboutGalleries', label: 'About galleries', href: '/admin/collections/aboutGalleries', icon: 'collection' },
  { id: 'nav-pages', label: 'Pages', href: '/admin/collections/pages', icon: 'collection' },
  { id: 'nav-authors', label: 'Authors', href: '/admin/collections/authors', icon: 'collection' },
  { id: 'nav-categories', label: 'Categories', href: '/admin/collections/categories', icon: 'collection' },
  { id: 'nav-newsCategories', label: 'News categories', href: '/admin/collections/newsCategories', icon: 'collection' },
  { id: 'nav-knowledgeCategories', label: 'Knowledge categories', href: '/admin/collections/knowledgeCategories', icon: 'collection' },
  { id: 'nav-jobLocations', label: 'Job locations', href: '/admin/collections/jobLocations', icon: 'collection' },
  { id: 'nav-forms', label: 'Forms', href: '/admin/collections/forms', icon: 'collection' },
  { id: 'nav-leads', label: 'Leads', href: '/admin/collections/leads', icon: 'collection' },
  { id: 'nav-redirects', label: 'Redirects', href: '/admin/collections/redirects', icon: 'collection' },
  { id: 'nav-auditLog', label: 'Audit log', href: '/admin/collections/audit-log', icon: 'collection' },
  { id: 'nav-users', label: 'Users', href: '/admin/collections/users', icon: 'collection' },
  { id: 'nav-globals-site', label: 'Site settings', href: '/admin/globals/siteSettings', icon: 'collection' },
  { id: 'nav-globals-seo', label: 'SEO defaults', href: '/admin/globals/seoDefaults', icon: 'collection' },
  { id: 'nav-globals-mainNav', label: 'Main navigation', href: '/admin/globals/mainNav', icon: 'collection' },
  { id: 'nav-globals-footerNav', label: 'Footer navigation', href: '/admin/globals/footerNav', icon: 'collection' },
  { id: 'nav-globals-legal', label: 'Legal', href: '/admin/globals/legal', icon: 'collection' },
  { id: 'nav-globals-announcements', label: 'Announcements', href: '/admin/globals/announcements', icon: 'collection' },
];

const CREATE_TARGETS: Array<Omit<Action, 'group'>> = [
  { id: 'create-blog', label: 'New blog post', hint: 'Blogs', href: '/admin/collections/blogs/create', icon: 'plus' },
  { id: 'create-news', label: 'New news article', hint: 'News', href: '/admin/collections/news/create', icon: 'plus' },
  { id: 'create-guide', label: 'New guide', hint: 'Guides', href: '/admin/collections/guides/create', icon: 'plus' },
  { id: 'create-resource', label: 'New resource', hint: 'Resources', href: '/admin/collections/resources/create', icon: 'plus' },
  { id: 'create-kb', label: 'New knowledge article', hint: 'Knowledge Hub', href: '/admin/collections/knowledgeBase/create', icon: 'plus' },
  { id: 'create-event', label: 'New event', hint: 'Events', href: '/admin/collections/events/create', icon: 'plus' },
  { id: 'create-webinar', label: 'New webinar', hint: 'Webinars', href: '/admin/collections/webinars/create', icon: 'plus' },
  { id: 'create-job', label: 'New job', hint: 'Jobs', href: '/admin/collections/jobs/create', icon: 'plus' },
  { id: 'create-page', label: 'New page', hint: 'Pages', href: '/admin/collections/pages/create', icon: 'plus' },
  { id: 'create-author', label: 'New author', hint: 'Authors', href: '/admin/collections/authors/create', icon: 'plus' },
  { id: 'create-redirect', label: 'New redirect', hint: 'Redirects', href: '/admin/collections/redirects/create', icon: 'plus' },
];

const SEARCHABLE_COLLECTIONS: ReadonlyArray<{ slug: string; label: string }> = [
  { slug: 'blogs', label: 'Blog' },
  { slug: 'news', label: 'News' },
  { slug: 'guides', label: 'Guide' },
  { slug: 'resources', label: 'Resource' },
  { slug: 'knowledgeBase', label: 'Knowledge' },
  { slug: 'events', label: 'Event' },
  { slug: 'webinars', label: 'Webinar' },
  { slug: 'jobs', label: 'Job' },
  { slug: 'pages', label: 'Page' },
  { slug: 'authors', label: 'Author' },
];

const Glyph = ({ kind }: { kind: Action['icon'] }): ReactElement => {
  if (kind === 'home') {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
        <path d="M2 8.5L8 3l6 5.5V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M6.5 15v-4a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === 'plus') {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
        <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === 'doc') {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
        <path d="M4 2h6l3 3v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M10 2v3h3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === 'clock') {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 5v3l2 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="10" height="10" rx="1.4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 6h10" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
};

const fuzzyMatches = (label: string, q: string): boolean => {
  const target = label.toLowerCase();
  const query = q.trim().toLowerCase();
  if (query.length === 0) return true;
  // Each query token must appear as a substring (in any order).
  return query.split(/\s+/).every((token) => target.includes(token));
};

// ─── Recent-history persistence ─────────────────────────────────
//
// We track the last N actions the editor activated (collection list
// jumps + opened documents) in `localStorage`. When the palette opens
// with an empty query we surface them as a "Recent" group at the top
// so the most-frequent navigation is one keystroke away.
//
// Skip 'create' actions — they don't correspond to a stable destination
// (each invocation creates a fresh doc with a new id).
const RECENT_KEY = 'cs-cmdk:recent';
const RECENT_LIMIT = 8;

const loadRecent = (): Action[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is Action =>
          item != null &&
          typeof item === 'object' &&
          typeof (item as Action).id === 'string' &&
          typeof (item as Action).label === 'string' &&
          typeof (item as Action).href === 'string',
      )
      .slice(0, RECENT_LIMIT);
  } catch {
    return [];
  }
};

const saveRecent = (action: Action): void => {
  if (typeof window === 'undefined') return;
  if (action.group === 'create') return;
  try {
    const list = loadRecent().filter((a) => a.id !== action.id);
    list.unshift({ ...action, group: 'recent' as const } as Action);
    window.localStorage.setItem(
      RECENT_KEY,
      JSON.stringify(list.slice(0, RECENT_LIMIT)),
    );
  } catch {
    // localStorage may be disabled (private mode, quota exceeded) — silently
    // skip; recent history is best-effort.
  }
};

const removeRecent = (id: string): Action[] => {
  if (typeof window === 'undefined') return [];
  const next = loadRecent().filter((a) => a.id !== id);
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // ignore quota / private-mode failures
  }
  return next;
};

const clearAllRecent = (): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(RECENT_KEY);
  } catch {
    // ignore
  }
};

const stripHashFromTitle = (raw: unknown): string => {
  if (typeof raw !== 'string') return '';
  return raw.length > 0 ? raw : '';
};

/**
 * Cmd / Ctrl + K command palette. Mounts globally via
 * `admin.components.actions` so the shortcut works on every admin
 * view. Renders a centred dialog with three result groups:
 *
 *  1. Navigate — every collection + global, plus the dashboard
 *  2. Create — quick-create routes for the most-used content collections
 *  3. Documents — live REST search across content collections (debounced;
 *     only fires when the query has 2+ characters)
 *
 * Keyboard:
 *   ↑/↓        move selection
 *   Enter      activate selected item (Next.js client-side nav)
 *   Esc        close
 *   Cmd/Ctrl+K toggle
 *
 * Lives outside Payload's nav so it works regardless of which view the
 * user is on. Search uses `?where[title][like]=` against each collection;
 * collections that fail (access-denied, missing) are silently skipped.
 */
export const CommandPalette = (): ReactElement | null => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [docHits, setDocHits] = useState<DocHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [recent, setRecent] = useState<Action[]>([]);

  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setDocHits([]);
    setActiveIndex(0);
  }, []);

  const activate = useCallback(
    (action: Action): void => {
      saveRecent(action);
      window.location.href = action.href;
      close();
    },
    [close],
  );

  // Global Cmd+K listener + custom-event opener (the SidebarHeader
  // search button dispatches `cs-cmdk:open` so the palette can be
  // opened by mouse without bypassing this single source of truth).
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === 'Escape' && open) {
        e.preventDefault();
        close();
      }
    };
    const onOpenEvent = (): void => setOpen(true);
    document.addEventListener('keydown', onKey);
    document.addEventListener('cs-cmdk:open', onOpenEvent);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('cs-cmdk:open', onOpenEvent);
    };
  }, [open, close]);

  // Refresh recent list on every open so a destination opened in the
  // current session shows up next time without remounting the component.
  useEffect(() => {
    if (open) setRecent(loadRecent());
  }, [open]);

  // Open / close native <dialog>.
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open) {
      if (!dlg.open) dlg.showModal?.();
      // Focus the input on next tick so the dialog has finished mounting.
      window.setTimeout(() => inputRef.current?.focus(), 0);
    } else if (dlg.open) {
      dlg.close?.();
    }
  }, [open]);

  // Live document search — debounced REST calls.
  useEffect(() => {
    if (!open) return undefined;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setDocHits([]);
      setSearching(false);
      return undefined;
    }
    let cancelled = false;
    setSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const lists = await Promise.all(
          SEARCHABLE_COLLECTIONS.map(async ({ slug, label }) => {
            try {
              const url = new URL(
                `/api/${slug}`,
                window.location.origin,
              );
              url.searchParams.set('limit', '4');
              url.searchParams.set('depth', '0');
              url.searchParams.set('sort', '-updatedAt');
              url.searchParams.set('where[title][like]', trimmed);
              const res = await fetch(url.toString(), {
                credentials: 'include',
              });
              if (!res.ok) return [];
              const json = (await res.json()) as { docs?: Array<Record<string, unknown>> };
              return (json.docs ?? []).map((d): DocHit => ({
                id: (d.id ?? '') as string | number,
                title:
                  stripHashFromTitle(d.title) ||
                  stripHashFromTitle(d.name) ||
                  String(d.id ?? 'Untitled'),
                collection: slug,
                collectionLabel: label,
                href: `/admin/collections/${slug}/${d.id}`,
              }));
            } catch {
              return [];
            }
          }),
        );
        if (cancelled) return;
        const flat = lists.flat();
        // Cap to ~20 results so the palette doesn't run off-screen.
        setDocHits(flat.slice(0, 20));
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 220);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, query]);

  const filteredNav = useMemo<Action[]>(
    () =>
      NAV_TARGETS.filter((t) => fuzzyMatches(t.label, query))
        .map((t): Action => ({ ...t, group: 'navigate' }))
        .slice(0, 12),
    [query],
  );

  const filteredCreate = useMemo<Action[]>(
    () =>
      CREATE_TARGETS.filter(
        (t) => fuzzyMatches(t.label, query) || fuzzyMatches(t.hint ?? '', query),
      )
        .map((t): Action => ({ ...t, group: 'create' }))
        .slice(0, 8),
    [query],
  );

  const docActions = useMemo<Action[]>(
    () =>
      docHits.map(
        (h): Action => ({
          id: `doc-${h.collection}-${h.id}`,
          label: h.title,
          hint: h.collectionLabel,
          href: h.href,
          group: 'document',
          icon: 'doc',
        }),
      ),
    [docHits],
  );

  // Recent-history group — only surfaces when the query is empty so it
  // doesn't compete with active filtering. Stamped with `group:'recent'`
  // and the doc icon so it reads as past navigation rather than a
  // first-class destination.
  const recentActions = useMemo<Action[]>(
    () =>
      query.trim().length > 0
        ? []
        : recent.map((r): Action => ({
            ...r,
            group: 'recent',
            icon: r.icon ?? 'doc',
          })),
    [query, recent],
  );

  const allActions = useMemo<Action[]>(
    () => [...recentActions, ...filteredNav, ...filteredCreate, ...docActions],
    [recentActions, filteredNav, filteredCreate, docActions],
  );

  // Reset selection whenever the result set actually changes. The deps
  // intentionally include `actionCount` even though the body only calls
  // `setActiveIndex` — biome's exhaustive-deps rule flags it because
  // setters are stable, but the effect *intent* is "re-run when the
  // result-set size changes" so we want it in the deps.
  const actionCount = allActions.length;
  // biome-ignore lint/correctness/useExhaustiveDependencies: trigger-only dep
  useEffect(() => {
    setActiveIndex(0);
  }, [actionCount]);

  // Keep the active row in view while arrow-key navigating.
  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    if (!list) return;
    const target = list.querySelector<HTMLElement>(
      `[data-index='${activeIndex}']`,
    );
    target?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const onListKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>): void => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, allActions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const action = allActions[activeIndex];
        if (action) activate(action);
      }
    },
    [allActions, activeIndex, activate],
  );

  // Note: do NOT short-circuit on `typeof window === 'undefined'` here.
  // That diverges the SSR and client trees (server renders nothing,
  // client renders a <dialog>) and triggers a hydration mismatch. The
  // <dialog> is safe to render on the server in its closed state — the
  // useEffect above is what actually calls `.showModal()` on the client.
  return (
    <dialog
      ref={dialogRef}
      className="cs-cmdk"
      aria-label="Command palette"
      onClose={close}
      onClick={(e) => {
        if (e.target === dialogRef.current) close();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') close();
      }}
    >
      <div className="cs-cmdk__panel" onKeyDown={onListKeyDown} role="presentation">
        <div className="cs-cmdk__head">
          <span className="cs-cmdk__icon" aria-hidden="true">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              focusable="false"
            >
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
          <input
            ref={inputRef}
            type="search"
            className="cs-cmdk__input"
            placeholder="Search collections, create, or jump to a doc…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            spellCheck={false}
            autoComplete="off"
          />
          <span className="cs-cmdk__esc" aria-hidden="true">esc</span>
        </div>

        <div className="cs-cmdk__list" ref={listRef}>
          {recentActions.length > 0 && (
            <div className="cs-cmdk__group">
              <div className="cs-cmdk__group-label cs-cmdk__group-label--with-action">
                <span>Recent</span>
                <button
                  type="button"
                  className="cs-cmdk__clear-all"
                  onClick={() => {
                    clearAllRecent();
                    setRecent([]);
                  }}
                >
                  Clear history
                </button>
              </div>
              {recentActions.map((a) => (
                <RecentRow
                  key={`recent-${a.id}`}
                  action={{ ...a, icon: 'clock' }}
                  index={allActions.indexOf(a)}
                  active={allActions.indexOf(a) === activeIndex}
                  onActivate={() => activate(a)}
                  onHover={() => setActiveIndex(allActions.indexOf(a))}
                  onRemove={() => setRecent(removeRecent(a.id))}
                />
              ))}
            </div>
          )}

          {filteredNav.length > 0 && (
            <div className="cs-cmdk__group">
              <div className="cs-cmdk__group-label">Jump to</div>
              {filteredNav.map((a) => (
                <ActionRow
                  key={a.id}
                  action={a}
                  index={allActions.indexOf(a)}
                  active={allActions.indexOf(a) === activeIndex}
                  onActivate={() => activate(a)}
                  onHover={() => setActiveIndex(allActions.indexOf(a))}
                />
              ))}
            </div>
          )}

          {filteredCreate.length > 0 && (
            <div className="cs-cmdk__group">
              <div className="cs-cmdk__group-label">Create</div>
              {filteredCreate.map((a) => (
                <ActionRow
                  key={a.id}
                  action={a}
                  index={allActions.indexOf(a)}
                  active={allActions.indexOf(a) === activeIndex}
                  onActivate={() => activate(a)}
                  onHover={() => setActiveIndex(allActions.indexOf(a))}
                />
              ))}
            </div>
          )}

          {(docActions.length > 0 || searching) && query.trim().length >= 2 && (
            <div className="cs-cmdk__group">
              <div className="cs-cmdk__group-label">
                Documents{searching ? ' · searching…' : ''}
              </div>
              {docActions.map((a) => (
                <ActionRow
                  key={a.id}
                  action={a}
                  index={allActions.indexOf(a)}
                  active={allActions.indexOf(a) === activeIndex}
                  onActivate={() => activate(a)}
                  onHover={() => setActiveIndex(allActions.indexOf(a))}
                />
              ))}
              {!searching && docActions.length === 0 && (
                <div className="cs-cmdk__empty">No documents match.</div>
              )}
            </div>
          )}

          {allActions.length === 0 && !searching && (
            <div className="cs-cmdk__empty cs-cmdk__empty--global">
              No matches. Press Esc to close.
            </div>
          )}
        </div>

        <div className="cs-cmdk__foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </dialog>
  );
};

type ActionRowProps = {
  action: Action;
  index: number;
  active: boolean;
  onActivate: () => void;
  onHover: () => void;
};

const ActionRow = ({
  action,
  index,
  active,
  onActivate,
  onHover,
}: ActionRowProps): ReactElement => (
  <button
    type="button"
    data-index={index}
    className={
      active
        ? 'cs-cmdk__row cs-cmdk__row--active'
        : 'cs-cmdk__row'
    }
    onClick={onActivate}
    onMouseEnter={onHover}
    onFocus={onHover}
  >
    <span className="cs-cmdk__row-icon" aria-hidden="true">
      <Glyph kind={action.icon} />
    </span>
    <span className="cs-cmdk__row-label">{action.label}</span>
    {action.hint && <span className="cs-cmdk__row-hint">{action.hint}</span>}
  </button>
);

type RecentRowProps = ActionRowProps & {
  onRemove: () => void;
};

/**
 * Recent-history row — same visual rhythm as `ActionRow` but rendered
 * as a flex container so we can sit a sibling × button next to the
 * activate button. Nesting interactive elements would break a11y; the
 * two-button layout keeps each affordance reachable on its own.
 */
const RecentRow = ({
  action,
  index,
  active,
  onActivate,
  onHover,
  onRemove,
}: RecentRowProps): ReactElement => (
  <div
    className={
      active
        ? 'cs-cmdk__row-wrap cs-cmdk__row-wrap--active'
        : 'cs-cmdk__row-wrap'
    }
  >
    <button
      type="button"
      data-index={index}
      className="cs-cmdk__row cs-cmdk__row--recent"
      onClick={onActivate}
      onMouseEnter={onHover}
      onFocus={onHover}
    >
      <span className="cs-cmdk__row-icon" aria-hidden="true">
        <Glyph kind={action.icon} />
      </span>
      <span className="cs-cmdk__row-label">{action.label}</span>
      {action.hint && <span className="cs-cmdk__row-hint">{action.hint}</span>}
    </button>
    <button
      type="button"
      className="cs-cmdk__row-remove"
      onClick={(e) => {
        e.stopPropagation();
        onRemove();
      }}
      aria-label={`Remove ${action.label} from recent history`}
      title="Remove from recent"
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M4.7 4.7a1 1 0 0 1 1.4 0L8 6.6l1.9-1.9a1 1 0 1 1 1.4 1.4L9.4 8l1.9 1.9a1 1 0 1 1-1.4 1.4L8 9.4l-1.9 1.9a1 1 0 1 1-1.4-1.4L6.6 8 4.7 6.1a1 1 0 0 1 0-1.4Z"
        />
      </svg>
    </button>
  </div>
);

export default CommandPalette;
