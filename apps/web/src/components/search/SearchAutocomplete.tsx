'use client';

import { CornerDownLeft, FileText, Loader2, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import type { SearchHit } from '@/lib/search';

const DEBOUNCE_MS = 200;
const MIN_QUERY_LENGTH = 2;

type Status = 'idle' | 'loading' | 'done';

interface SearchAutocompleteProps {
  placeholder?: string;
  ariaLabel?: string;
}

/**
 * Inline search field with an autocomplete dropdown anchored directly beneath
 * it. Debounced typeahead against the same-origin `/api/search` route
 * (Meilisearch-backed). The results panel is portaled to `document.body` and
 * fixed-positioned to the input so it escapes the hero's `overflow-hidden`.
 */
export function SearchAutocomplete({
  placeholder = 'Search articles, guides, news…',
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
    setRect({ left: r.left, top: r.bottom + 8, width: r.width });
  }, []);

  // Keep the portaled panel anchored to the input on scroll / resize.
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

  // Debounced search; AbortController drops a stale response.
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
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
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
  }, [query]);

  // Close when clicking outside the input + panel.
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

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
        return;
      }
      if (e.key === 'ArrowDown' && !open && query.trim().length >= MIN_QUERY_LENGTH) {
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
    [open, hits, activeIndex, go, query],
  );

  useEffect(() => {
    const node = panelRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const trimmed = query.trim();
  const showPanel = open && trimmed.length >= MIN_QUERY_LENGTH;

  return (
    <search aria-label={ariaLabel} className="contents">
      <div ref={wrapRef} className="relative w-full max-w-[674px]">
        <div className="flex h-10 w-full items-center gap-3 rounded-[12px] border border-[rgba(237,203,255,0.6)] bg-white/20 px-[14px] sm:h-11">
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
            className="h-full flex-1 bg-transparent text-base text-white placeholder:text-white/60 outline-none [&::-webkit-search-cancel-button]:appearance-none"
            style={{ fontWeight: 400 }}
          />
        </div>

        {mounted && showPanel && rect
          ? createPortal(
              <div
                ref={panelRef}
                id={listboxId}
                style={{ position: 'fixed', left: rect.left, top: rect.top, width: rect.width }}
                className="z-[80] flex max-h-[min(60vh,420px)] flex-col overflow-hidden rounded-2xl border border-[#ECECF2] bg-white text-left shadow-[0_24px_60px_-15px_rgba(15,16,35,0.28)]"
              >
                <div className="min-h-0 flex-1 overflow-y-auto py-2">
                  {status === 'loading' && hits.length === 0 && (
                    <p className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-[#5A5F75]">
                      <Loader2 className="size-4 animate-spin" aria-hidden /> Searching…
                    </p>
                  )}

                  {status === 'done' && hits.length === 0 && (
                    <p className="px-4 py-6 text-center text-sm text-[#5A5F75]">
                      No results for “{trimmed}”.
                    </p>
                  )}

                  {hits.map((hit, i) => (
                    <button
                      key={hit.id}
                      type="button"
                      data-index={i}
                      // onMouseDown (not onClick) so it fires before the input's blur closes the panel.
                      onMouseDown={(e) => {
                        e.preventDefault();
                        go(hit);
                      }}
                      onMouseMove={() => setActiveIndex(i)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        i === activeIndex ? 'bg-[#F4F2FB]' : 'bg-transparent'
                      }`}
                    >
                      <FileText className="size-4 shrink-0 text-[#7C5CFF]" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-[15px] font-medium text-[#0F1023]">
                          {hit.title}
                        </span>
                        {hit.description.length > 0 && (
                          <span className="mt-0.5 block truncate text-[13px] text-[#5A5F75]">
                            {hit.description}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 rounded-full border border-[#E7E3F5] bg-[#F7F5FD] px-2 py-0.5 text-[11px] font-medium text-[#6B5BA6]">
                        {hit.label}
                      </span>
                      {i === activeIndex && (
                        <CornerDownLeft className="size-3.5 shrink-0 text-[#9A9DB0]" aria-hidden />
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-4 border-t border-[#EDEEF4] px-4 py-2.5 text-[11px] text-[#9A9DB0]">
                  <span className="flex items-center gap-1.5">
                    <Kbd>↑</Kbd>
                    <Kbd>↓</Kbd>
                    navigate
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Kbd>↵</Kbd>
                    select
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Kbd>esc</Kbd>
                    close
                  </span>
                </div>
              </div>,
              document.body,
            )
          : null}
      </div>
    </search>
  );
}

function Kbd({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <kbd className="inline-flex min-w-[18px] items-center justify-center rounded border border-[#E5E7EF] bg-[#F7F8FB] px-1 py-0.5 font-sans text-[10px] leading-none text-[#6B7080]">
      {children}
    </kbd>
  );
}
