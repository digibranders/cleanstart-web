'use client';

import { Dialog } from '@base-ui/react/dialog';
import { Search, SearchX, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { SearchHit } from '@/lib/search';
import { Kbd, ResultRow, SkeletonRows, groupHits } from './search-ui';

const DEBOUNCE_MS = 200;
const MIN_QUERY_LENGTH = 2;

type Status = 'idle' | 'loading' | 'done';

interface SearchCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Site-wide ⌘K command palette: a centered modal that searches across every
 * content type (Knowledge Hub, guides, blogs, news, resources, …) and groups
 * results by type. Opened globally by `SearchProvider`. Scoped, inline search
 * for a single section lives in `SearchAutocomplete`.
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
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset + focus the input each time the palette opens.
  useEffect(() => {
    if (!open) return undefined;
    setQuery('');
    setHits([]);
    setStatus('idle');
    setActiveIndex(0);
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

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

  const { groups, flat } = groupHits(hits);

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
      if (flat.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % flat.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + flat.length) % flat.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        go(flat[activeIndex]);
      }
    },
    [flat, activeIndex, go],
  );

  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const trimmed = query.trim();
  let cursor = -1;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[100] bg-[#0B0A1A]/45 supports-backdrop-filter:backdrop-blur-[2px]" />
        <Dialog.Popup
          initialFocus={inputRef}
          className="fixed left-1/2 top-[10vh] z-[100] flex max-h-[78vh] w-[calc(100vw-1.5rem)] max-w-[640px] -translate-x-1/2 flex-col overflow-hidden rounded-[18px] border border-black/[0.06] bg-white text-left shadow-[0_32px_90px_-24px_rgba(8,4,24,0.45),0_10px_28px_-14px_rgba(8,4,24,0.25)] ring-1 ring-black/[0.02] sm:top-[12vh]"
        >
          <Dialog.Title className="sr-only">Search CleanStart</Dialog.Title>

          <div className="flex h-14 items-center gap-3 border-b border-[#EDEEF4] px-4">
            <Search className="size-[18px] shrink-0 text-[#9A9DB0]" aria-hidden />
            {/* text-base (16px) is mandatory — iOS Safari zooms on a smaller font. */}
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
              onKeyDown={onKeyDown}
              placeholder="Search articles, guides, news…"
              aria-label="Search CleanStart"
              className="h-full flex-1 bg-transparent text-base text-[#0F1023] placeholder:text-[#9A9DB0] outline-none [&::-webkit-search-cancel-button]:appearance-none"
            />
            <Dialog.Close
              aria-label="Close search"
              className="grid size-7 shrink-0 place-items-center rounded-md text-[#9A9DB0] transition-colors hover:bg-[#F2F3F7] hover:text-[#5A5F75]"
            >
              <X className="size-4" aria-hidden />
            </Dialog.Close>
          </div>

          <div
            ref={listRef}
            className="min-h-0 flex-1 overflow-y-auto py-1.5 [scrollbar-color:rgba(15,16,35,0.18)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/15 [&::-webkit-scrollbar]:w-2"
          >
            {status === 'idle' && (
              <p className="px-4 py-10 text-center text-sm text-[#9A9DB0]">
                Search the Knowledge Hub, guides, blogs, news and more.
              </p>
            )}

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

            {groups.map((group) => (
              <div key={group.collection} className="pb-1">
                <div className="flex items-center justify-between px-4 pt-2.5 pb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#9A9DB0]">
                    {group.label}
                  </span>
                  <span className="text-[11px] font-medium tabular-nums text-[#C2C4D2]">
                    {group.hits.length}
                  </span>
                </div>
                {group.hits.map((hit) => {
                  cursor += 1;
                  const i = cursor;
                  return (
                    <ResultRow
                      key={hit.id}
                      hit={hit}
                      index={i}
                      active={i === activeIndex}
                      query={trimmed}
                      onSelect={go}
                      onHover={setActiveIndex}
                    />
                  );
                })}
              </div>
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
            {flat.length > 0 && (
              <span className="text-[11px] font-medium tabular-nums text-[#9A9DB0]">
                {flat.length} result{flat.length === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
