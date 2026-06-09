'use client';

import {
  BookOpen,
  Briefcase,
  CalendarDays,
  Compass,
  CornerDownLeft,
  type LucideIcon,
  Mic,
  Newspaper,
  PenLine,
  Search,
  SearchX,
  Sparkles,
  UserRound,
  Video,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import type { SearchHit } from '@/lib/search';

const DEBOUNCE_MS = 200;
const MIN_QUERY_LENGTH = 2;

type Status = 'idle' | 'loading' | 'done';

/** Per-collection identity: icon + accent so each result type is scannable. */
interface CollectionMeta {
  Icon: LucideIcon;
  accent: string;
  tint: string;
}
const COLLECTION_META: Record<string, CollectionMeta> = {
  knowledgeBase: { Icon: BookOpen, accent: '#4F46E5', tint: '#EEF0FF' },
  guides: { Icon: Compass, accent: '#0D9488', tint: '#E4F5F2' },
  blogs: { Icon: PenLine, accent: '#2563EB', tint: '#E8F0FE' },
  news: { Icon: Newspaper, accent: '#D97706', tint: '#FBF1E0' },
  resources: { Icon: Sparkles, accent: '#7C3AED', tint: '#F2ECFE' },
  events: { Icon: CalendarDays, accent: '#E11D48', tint: '#FCE7EC' },
  webinars: { Icon: Video, accent: '#0891B2', tint: '#E1F4FA' },
  jobs: { Icon: Briefcase, accent: '#0F766E', tint: '#E2F3F1' },
  podcastEpisodes: { Icon: Mic, accent: '#C026D3', tint: '#FAEAFD' },
  authors: { Icon: UserRound, accent: '#475569', tint: '#EEF1F5' },
};
const DEFAULT_META: CollectionMeta = { Icon: BookOpen, accent: '#6B5BA6', tint: '#F2EFFB' };
const metaFor = (collection: string): CollectionMeta => COLLECTION_META[collection] ?? DEFAULT_META;

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Bold the matched query tokens inside a result title. */
function Highlight({ text, query }: { text: string; query: string }): React.ReactElement {
  const tokens = query
    .trim()
    .split(/\s+/)
    .filter((t) => t.length >= 2)
    .map(escapeRegExp);
  if (tokens.length === 0) return <>{text}</>;
  const re = new RegExp(`(?:${tokens.join('|')})`, 'ig');
  const out: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const match of text.matchAll(re)) {
    const idx = match.index ?? 0;
    if (idx > last) {
      out.push(<span key={`g${key}`}>{text.slice(last, idx)}</span>);
      key += 1;
    }
    out.push(
      <mark key={`g${key}`} className="rounded-[3px] bg-[#ECE6FF] px-[1px] font-semibold text-[#3D1E9E]">
        {match[0]}
      </mark>,
    );
    key += 1;
    last = idx + match[0].length;
  }
  if (last < text.length) {
    out.push(<span key={`g${key}`}>{text.slice(last)}</span>);
  }
  return <>{out}</>;
}

interface SearchAutocompleteProps {
  placeholder?: string;
  ariaLabel?: string;
}

/**
 * Premium inline search: a field whose results drop into a grouped, type-aware
 * panel anchored directly beneath it. Debounced typeahead against the
 * same-origin `/api/search` route (Meilisearch). The panel is portaled to
 * `document.body` and fixed-positioned to the input so it escapes the hero's
 * `overflow-hidden`.
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

  // Debounced search; AbortController drops stale responses.
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

  // Close on outside click.
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

  const trimmed = query.trim();
  const showPanel = open && trimmed.length >= MIN_QUERY_LENGTH;

  // Group hits by collection (groups in first-seen = relevance order).
  const groups = useMemo(() => {
    const order: string[] = [];
    const byType = new Map<string, SearchHit[]>();
    for (const h of hits) {
      const list = byType.get(h.collection);
      if (list) list.push(h);
      else {
        byType.set(h.collection, [h]);
        order.push(h.collection);
      }
    }
    return order.map((c) => ({ collection: c, label: byType.get(c)?.[0]?.label ?? c, hits: byType.get(c) ?? [] }));
  }, [hits]);
  const flat = useMemo(() => groups.flatMap((g) => g.hits), [groups]);

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
      if (e.key === 'ArrowDown' && !open && trimmed.length >= MIN_QUERY_LENGTH) {
        setOpen(true);
        return;
      }
      if (!open || flat.length === 0) return;
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
    [open, flat, activeIndex, go, trimmed],
  );

  useEffect(() => {
    const node = panelRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const clear = useCallback(() => {
    setQuery('');
    inputRef.current?.focus();
  }, []);

  // Flattened render model: section headers interleaved with indexed rows.
  let rowCursor = -1;

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
                <div className="min-h-0 flex-1 overflow-y-auto py-1.5 [scrollbar-color:rgba(15,16,35,0.18)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/15 [&::-webkit-scrollbar]:w-2">
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

                  {groups.map((group) => {
                    const meta = metaFor(group.collection);
                    return (
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
                          rowCursor += 1;
                          const i = rowCursor;
                          const active = i === activeIndex;
                          return (
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
                              className={`group/row relative flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                                active ? 'bg-[#F6F4FC]' : 'bg-transparent'
                              }`}
                            >
                              <span
                                aria-hidden
                                className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full transition-opacity"
                                style={{ background: meta.accent, opacity: active ? 1 : 0 }}
                              />
                              <span
                                className="grid size-9 shrink-0 place-items-center rounded-[10px]"
                                style={{ background: meta.tint, color: meta.accent }}
                              >
                                <meta.Icon className="size-[18px]" aria-hidden />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-display text-[15px] font-medium leading-snug text-[#0F1023]">
                                  <Highlight text={hit.title} query={trimmed} />
                                </span>
                                {hit.description.length > 0 && (
                                  <span className="mt-0.5 block truncate text-[12.5px] leading-snug text-[#6B7080]">
                                    {hit.description}
                                  </span>
                                )}
                              </span>
                              <span
                                className={`shrink-0 transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`}
                              >
                                <span className="inline-flex items-center gap-1 rounded-md border border-[#E5E7EF] bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#8A8FA3]">
                                  <CornerDownLeft className="size-3" aria-hidden /> Jump
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
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
              </div>,
              document.body,
            )
          : null}
      </div>
    </search>
  );
}

function SkeletonRows(): React.ReactElement {
  return (
    <div className="px-3 py-1.5">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex animate-pulse items-center gap-3 px-0 py-2">
          <span className="size-9 shrink-0 rounded-[10px] bg-[#EEEFF4]" />
          <span className="min-w-0 flex-1">
            <span className="block h-3 w-[55%] rounded bg-[#EEEFF4]" />
            <span className="mt-2 block h-2.5 w-[80%] rounded bg-[#F2F3F7]" />
          </span>
        </div>
      ))}
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <kbd className="inline-flex min-w-[18px] items-center justify-center rounded-[5px] border border-[#E5E7EF] bg-white px-1 py-0.5 font-sans text-[10px] leading-none text-[#6B7080] shadow-[0_1px_0_rgba(15,16,35,0.04)]">
      {children}
    </kbd>
  );
}
