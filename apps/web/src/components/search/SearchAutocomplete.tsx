'use client';

import { Search, SearchX, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import type { SearchHit } from '@/lib/search';
import { Kbd, ResultRow, SkeletonRows } from './search-ui';

const DEBOUNCE_MS = 200;
const MIN_QUERY_LENGTH = 2;

type Status = 'idle' | 'loading' | 'done';

interface SearchAutocompleteProps {
  /** Restrict results to a single collection (default: Knowledge Hub articles). */
  collection?: string;
  placeholder?: string;
  ariaLabel?: string;
}

/**
 * Inline search field scoped to one collection (the Knowledge Hub by default),
 * with results dropping into a panel anchored directly beneath it. For
 * site-wide search across all content, use the ⌘K command palette instead.
 *
 * Debounced typeahead against the same-origin `/api/search` route
 * (Meilisearch). The panel is portaled to `document.body` and fixed-positioned
 * to the input so it escapes the hero's `overflow-hidden`.
 */
export function SearchAutocomplete({
  collection = 'knowledgeBase',
  placeholder = 'Search the Knowledge Hub…',
  ariaLabel = 'Search the Knowledge Hub',
}: SearchAutocompleteProps): React.ReactElement {
  const router = useRouter();
  const listboxId = useId();
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [rect, setRect] = useState<{ left: number; top: number; width: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const reposition = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ left: r.left, top: r.bottom + 10, width: r.width });
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    reposition();
    const onMove = (): void => reposition();
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [open, reposition]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_QUERY_LENGTH) {
      setHits([]);
      setStatus('idle');
      return undefined;
    }
    setStatus('loading');
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(q)}&type=${encodeURIComponent(collection)}`,
          { signal: controller.signal },
        );
        const data = (await res.json()) as { hits?: SearchHit[] };
        setHits(Array.isArray(data.hits) ? data.hits : []);
        setActiveIndex(0);
        setStatus('done');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setHits([]);
          setStatus('done');
        }
      }
    }, DEBOUNCE_MS);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, collection]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: MouseEvent): void => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const go = useCallback(
    (hit: SearchHit | undefined) => {
      if (!hit) return;
      setOpen(false);
      router.push(hit.href);
    },
    [router],
  );

  const trimmed = query.trim();
  const showPanel = open && trimmed.length >= MIN_QUERY_LENGTH;

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
        return;
      }
      if (e.key === 'ArrowDown' && !open && trimmed.length >= MIN_QUERY_LENGTH) {
        setOpen(true);
        return;
      }
      if (!open || hits.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % hits.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + hits.length) % hits.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        go(hits[activeIndex]);
      }
    },
    [open, hits, activeIndex, go, trimmed],
  );

  useEffect(() => {
    const node = panelRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const clear = useCallback(() => {
    setQuery('');
    inputRef.current?.focus();
  }, []);

  return (
    <search aria-label={ariaLabel} className="contents">
      <div ref={wrapRef} className="relative w-full max-w-[674px]">
        <div className="flex h-11 w-full items-center gap-3 rounded-[14px] border border-[rgba(237,203,255,0.55)] bg-white/15 px-[14px] transition focus-within:border-[rgba(237,203,255,0.9)] focus-within:bg-white/25 focus-within:ring-4 focus-within:ring-[rgba(124,92,255,0.16)]">
          <Search className="size-5 shrink-0 text-white/70" aria-hidden />
          {/* text-base (16px) is mandatory — iOS Safari zooms on a smaller font. */}
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-expanded={showPanel}
            aria-controls={listboxId}
            aria-autocomplete="list"
            value={query}
            placeholder={placeholder}
            onChange={(e) => {
              setQuery(e.currentTarget.value);
              setOpen(true);
            }}
            onFocus={() => {
              if (trimmed.length >= MIN_QUERY_LENGTH) setOpen(true);
              reposition();
            }}
            onKeyDown={onKeyDown}
            className="h-full flex-1 bg-transparent text-base text-white placeholder:text-white/55 outline-none [&::-webkit-search-cancel-button]:appearance-none"
            style={{ fontWeight: 400 }}
          />
          {query.length > 0 && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={clear}
              className="grid size-6 shrink-0 place-items-center rounded-full text-white/60 transition-colors hover:bg-white/15 hover:text-white"
            >
              <X className="size-4" aria-hidden />
            </button>
          )}
        </div>

        {mounted && showPanel && rect
          ? createPortal(
              <div
                ref={panelRef}
                id={listboxId}
                style={{ position: 'fixed', left: rect.left, top: rect.top, width: rect.width }}
                className="z-[80] flex max-h-[min(64vh,460px)] flex-col overflow-hidden rounded-[18px] border border-black/[0.06] bg-white text-left shadow-[0_24px_70px_-18px_rgba(15,16,35,0.32),0_8px_22px_-12px_rgba(15,16,35,0.18)] ring-1 ring-black/[0.02]"
              >
                <div className="scrollbar-premium min-h-0 flex-1 overflow-y-auto py-1.5">
                  {status === 'loading' && hits.length === 0 && <SkeletonRows />}

                  {status === 'done' && hits.length === 0 && (
                    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                      <span className="grid size-11 place-items-center rounded-full bg-[#F4F2FB]">
                        <SearchX className="size-5 text-[#9A8CD6]" aria-hidden />
                      </span>
                      <p className="text-sm font-medium text-[#0F1023]">No results for “{trimmed}”</p>
                      <p className="text-[13px] text-[#9A9DB0]">Try a different keyword or check the spelling.</p>
                    </div>
                  )}

                  {hits.map((hit, i) => (
                    <ResultRow
                      key={hit.id}
                      hit={hit}
                      index={i}
                      active={i === activeIndex}
                      query={trimmed}
                      tag={hit.categories[0]}
                      onSelect={go}
                      onHover={setActiveIndex}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-[#EDEEF4] bg-[#FCFCFE] px-4 py-2.5">
                  <span className="flex items-center gap-3 text-[11px] text-[#9A9DB0]">
                    <span className="flex items-center gap-1.5">
                      <Kbd>↑</Kbd>
                      <Kbd>↓</Kbd>
                      navigate
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Kbd>↵</Kbd>
                      open
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Kbd>esc</Kbd>
                      close
                    </span>
                  </span>
                  {hits.length > 0 && (
                    <span className="text-[11px] font-medium tabular-nums text-[#9A9DB0]">
                      {hits.length} result{hits.length === 1 ? '' : 's'}
                    </span>
                  )}
                </div>
              </div>,
              document.body,
            )
          : null}
      </div>
    </search>
  );
}
