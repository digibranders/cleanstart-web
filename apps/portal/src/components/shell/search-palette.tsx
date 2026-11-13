'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { IconName } from '@/components/icon-paths';
import type { SearchHitDto } from '@/lib/dto';
import { buildPageHits, SEARCH_MIN_CHARS } from '@/lib/search-pages';
import type { NavItem, PortalKind } from '@/lib/routes';
import { searchAction } from '@/server/actions/search';
import { Icon } from '../icon';

/** Anything that wants the palette open (the top bar button, the Help menu) dispatches this on `window`. */
export const OPEN_SEARCH_EVENT = 'portal:open-search';

const DEBOUNCE_MS = 150;
const GROUP_LABEL: Record<SearchHitDto['group'], string> = {
  registrations: 'Deals',
  partners: 'Partners',
  documents: 'Documents',
  people: 'People',
};
const PLACEHOLDER: Record<PortalKind, string> = {
  partner: 'Search deals, documents and pages',
  admin: 'Search partners, registrations and pages',
};

interface Row {
  key: string;
  label: string;
  hint: string;
  href: string;
  icon: IconName;
}

/**
 * Ctrl K search. Pages come from the viewer's own sidebar (static); deals, partners, documents and people come from
 * searchAction, which scopes every group to what the viewer may read. Mounted once by the shell.
 */
export function SearchPalette({ kind, nav }: { kind: PortalKind; nav: readonly NavItem[] }): React.JSX.Element | null {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHitDto[]>([]);
  const [failed, setFailed] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const requestId = useRef(0);
  const opener = useRef<HTMLElement | null>(null);
  const titleId = useId();

  const show = useCallback((): void => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setQuery('');
    setHits([]);
    setFailed(false);
    setOpen(true);
  }, []);

  const hide = useCallback((): void => {
    setOpen(false);
    requestId.current += 1;
    opener.current?.focus?.();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        show();
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_SEARCH_EVENT, show);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_SEARCH_EVENT, show);
    };
  }, [show]);

  // The newest answer wins: a slow reply to "ke" must not replace the reply to "kestrel".
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < SEARCH_MIN_CHARS) {
      requestId.current += 1;
      setHits([]);
      setFailed(false);
      return;
    }
    const mine = requestId.current + 1;
    requestId.current = mine;
    const timer = setTimeout(async () => {
      const result = await searchAction({ q, limit: 5 });
      if (requestId.current !== mine) return;
      setFailed(!result.ok);
      setHits(result.ok ? result.data : []);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [open, query]);

  const focusables = (): HTMLElement[] =>
    Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('input, button:not([tabindex="-1"]), a[href]') ?? []);

  useEffect(() => {
    if (open) dialogRef.current?.querySelector<HTMLInputElement>('input')?.focus();
  }, [open]);

  if (!open) return null;

  const q = query.trim();
  const groups: Array<{ name: string; rows: Row[] }> = [
    {
      name: 'Pages',
      rows: buildPageHits(nav, kind, q).map((p) => ({ key: `page-${p.href}`, label: p.label, hint: '', href: p.href, icon: p.icon })),
    },
    ...(['registrations', 'partners', 'documents', 'people'] as const).map((group) => ({
      name: GROUP_LABEL[group],
      rows: hits
        .filter((h) => h.group === group)
        .map((h, i) => ({ key: `${group}-${i}-${h.href}`, label: h.label, hint: h.hint, href: h.href, icon: h.icon })),
    })),
  ].filter((g) => g.rows.length > 0);

  const onDialogKey = (event: React.KeyboardEvent): void => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      hide();
      return;
    }
    const firstRow = groups[0]?.rows[0];
    if (event.key === 'Enter' && event.target instanceof HTMLInputElement && firstRow) {
      event.preventDefault();
      hide();
      router.push(firstRow.href);
      return;
    }
    const items = focusables();
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (event.key === 'Tab' && items.length > 0) {
      const last = items.length - 1;
      if (event.shiftKey && index <= 0) {
        event.preventDefault();
        items[last]?.focus();
      } else if (!event.shiftKey && index === last) {
        event.preventDefault();
        items[0]?.focus();
      }
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      const links = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('a.pal-item') ?? []);
      const at = links.indexOf(document.activeElement as HTMLElement);
      const target = event.key === 'ArrowDown' ? links[at + 1] : at <= 0 ? dialogRef.current?.querySelector<HTMLElement>('input') : links[at - 1];
      if (target) {
        event.preventDefault();
        target.focus();
      }
    }
  };

  return (
    <>
      <button
        type="button"
        className="cs-scrim"
        aria-label="Close search"
        tabIndex={-1}
        onClick={hide}
        style={{ border: 0, padding: 0, cursor: 'default' }}
      />
      <div
        ref={dialogRef}
        className="dialog palette"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onDialogKey}
      >
        <div className="pal-in">
          <Icon name="search" />
          <label className="sr" htmlFor={`${titleId}-q`} id={titleId}>
            Search
          </label>
          <input
            id={`${titleId}-q`}
            type="search"
            placeholder={PLACEHOLDER[kind]}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          <button type="button" className="ibtn" onClick={hide} aria-label="Close search" style={{ width: 26, height: 26 }}>
            <Icon name="x" />
          </button>
        </div>
        <div className="pal-list" aria-live="polite">
          {groups.map((g) => (
            <div key={g.name}>
              <div className="pal-g">{g.name}</div>
              {g.rows.map((row) => (
                <Link key={row.key} href={row.href} className="pal-item" onClick={() => setOpen(false)}>
                  <span className="li-ic">
                    <Icon name={row.icon} />
                  </span>
                  <span>{row.label}</span>
                  <span className="li-s">{row.hint}</span>
                </Link>
              ))}
            </div>
          ))}
          {groups.length === 0 ? <div className="empty">Nothing matches {query}.</div> : null}
          {failed ? <div className="empty">Search is not available right now. Pages still work.</div> : null}
        </div>
      </div>
    </>
  );
}
