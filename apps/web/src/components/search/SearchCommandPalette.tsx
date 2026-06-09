'use client';

import { Dialog } from '@base-ui/react/dialog';
import { CornerDownLeft, FileText, Loader2, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { SearchHit } from '@/lib/search';

const DEBOUNCE_MS = 220;
const MIN_QUERY_LENGTH = 2;

interface SearchCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Status = 'idle' | 'loading' | 'done';

/**
 * Site-wide ⌘K command palette. Debounced typeahead against the same-origin
 * `/api/search` route (Meilisearch-backed), keyboard-driven, jumps straight
 * to the chosen document. Mounted once globally by `SearchProvider`.
 */
export function SearchCommandPalette({
  open,
  onOpenChange,
}: SearchCommandPaletteProps): React.ReactElement {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset transient state each time the palette opens so a fresh session
  // never shows a previous query's stale results, and focus the input.
  // base-ui's `initialFocus` only fires for interaction-driven opens; we
  // open via controlled state (⌘K / a trigger button), so focus explicitly
  // once the portal has mounted — a short timeout lands after base-ui's own
  // focus pass so it isn't stolen back to the popup container.
  useEffect(() => {
    if (!open) return undefined;
    setQuery('');
    setHits([]);
    setStatus('idle');
    setActiveIndex(0);
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  // Debounced fetch. An AbortController cancels the in-flight request when
  // the query changes so a slow earlier response can't overwrite a newer one.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setHits([]);
      setStatus('idle');
      return;
    }
    setStatus('loading');
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
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

  const go = useCallback(
    (hit: SearchHit | undefined) => {
      if (!hit) return;
      onOpenChange(false);
      router.push(hit.href);
    },
    [router, onOpenChange],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (hits.length === 0) return;
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
    [hits, activeIndex, go],
  );

  // Keep the active row scrolled into view during keyboard navigation.
  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const trimmed = query.trim();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[100] bg-[#08041a]/60 supports-backdrop-filter:backdrop-blur-sm" />
        <Dialog.Popup
          initialFocus={inputRef}
          className="fixed left-1/2 top-[8vh] z-[100] flex max-h-[80vh] w-[calc(100vw-1.5rem)] max-w-[640px] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#151021]/95 text-white shadow-[0_24px_80px_-20px_rgba(8,4,24,0.85)] supports-backdrop-filter:backdrop-blur-2xl sm:top-[12vh]"
        >
          <Dialog.Title className="sr-only">Search CleanStart</Dialog.Title>

          <div className="flex items-center gap-3 border-b border-white/10 px-4">
            <Search className="size-[18px] shrink-0 text-white/45" aria-hidden />
            {/* text-base (16px) is mandatory — iOS Safari zooms on a smaller font. */}
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
              onKeyDown={onKeyDown}
              placeholder="Search articles, guides, news…"
              aria-label="Search CleanStart"
              className="h-14 flex-1 bg-transparent text-base text-white placeholder:text-white/40 outline-none [&::-webkit-search-cancel-button]:appearance-none"
            />
            <Dialog.Close
              aria-label="Close search"
              className="shrink-0 rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
            >
              <X className="size-4" aria-hidden />
            </Dialog.Close>
          </div>

          <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-2">
            {status === 'idle' && (
              <p className="px-4 py-8 text-center text-sm text-white/40">
                {trimmed.length === 0
                  ? 'Type to search the Knowledge Hub, blogs, guides, news and more.'
                  : 'Keep typing…'}
              </p>
            )}

            {status === 'loading' && hits.length === 0 && (
              <p className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-white/40">
                <Loader2 className="size-4 animate-spin" aria-hidden /> Searching…
              </p>
            )}

            {status === 'done' && hits.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-white/40">
                No results for “{trimmed}”.
              </p>
            )}

            {hits.map((hit, i) => (
              <button
                key={hit.id}
                type="button"
                data-index={i}
                onClick={() => go(hit)}
                onMouseMove={() => setActiveIndex(i)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  i === activeIndex ? 'bg-white/[0.07]' : 'bg-transparent'
                }`}
              >
                <FileText className="size-4 shrink-0 text-[#9b8cff]" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-display text-[15px] font-medium text-white">
                      {hit.title}
                    </span>
                  </span>
                  {hit.description.length > 0 && (
                    <span className="mt-0.5 block truncate text-[13px] text-white/45">
                      {hit.description}
                    </span>
                  )}
                </span>
                <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-white/55">
                  {hit.label}
                </span>
                {i === activeIndex && (
                  <CornerDownLeft className="size-3.5 shrink-0 text-white/35" aria-hidden />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 border-t border-white/10 px-4 py-2.5 text-[11px] text-white/35">
            <span className="flex items-center gap-1.5">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>↵</Kbd>
              to open
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>esc</Kbd>
              to close
            </span>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Kbd({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <kbd className="inline-flex min-w-[18px] items-center justify-center rounded border border-white/15 bg-white/[0.05] px-1 py-0.5 font-sans text-[10px] leading-none text-white/55">
      {children}
    </kbd>
  );
}
