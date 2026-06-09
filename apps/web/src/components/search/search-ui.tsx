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
  Sparkles,
  UserRound,
  Video,
} from 'lucide-react';

import type { SearchHit } from '@/lib/search';

/** Per-collection identity: icon + accent so each result type is scannable. */
export interface CollectionMeta {
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
export const metaFor = (collection: string): CollectionMeta =>
  COLLECTION_META[collection] ?? DEFAULT_META;

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Bold the matched query tokens inside a result title. */
export function Highlight({ text, query }: { text: string; query: string }): React.ReactElement {
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

/** Group hits by collection, groups in first-seen (relevance) order. */
export interface SearchGroup {
  collection: string;
  label: string;
  hits: SearchHit[];
}
export function groupHits(hits: SearchHit[]): { groups: SearchGroup[]; flat: SearchHit[] } {
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
  const groups = order.map((c) => ({
    collection: c,
    label: byType.get(c)?.[0]?.label ?? c,
    hits: byType.get(c) ?? [],
  }));
  return { groups, flat: groups.flatMap((g) => g.hits) };
}

/** A single result row, shared by the inline dropdown and the command palette. */
export function ResultRow({
  hit,
  index,
  active,
  query,
  tag,
  onSelect,
  onHover,
}: {
  hit: SearchHit;
  index: number;
  active: boolean;
  query: string;
  tag?: string | undefined;
  onSelect: (hit: SearchHit) => void;
  onHover: (index: number) => void;
}): React.ReactElement {
  const meta = metaFor(hit.collection);
  return (
    <button
      type="button"
      data-index={index}
      // onMouseDown (not onClick) so it fires before the input's blur closes the panel.
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect(hit);
      }}
      onMouseMove={() => onHover(index)}
      className={`group/row relative flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
        active ? 'bg-[#F6F4FC]' : 'bg-transparent'
      }`}
    >
      <span
        aria-hidden
        className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full"
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
          <Highlight text={hit.title} query={query} />
        </span>
        {hit.description.length > 0 && (
          <span className="mt-0.5 block truncate text-[12.5px] leading-snug text-[#6B7080]">
            {hit.description}
          </span>
        )}
      </span>
      {tag ? (
        <span className="hidden shrink-0 rounded-full border border-[#ECEDF3] bg-[#FAFAFD] px-2 py-0.5 text-[11px] font-medium text-[#8A8FA3] sm:inline">
          {tag}
        </span>
      ) : null}
      <span className={`shrink-0 transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`}>
        <span className="inline-flex items-center gap-1 rounded-md border border-[#E5E7EF] bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#8A8FA3]">
          <CornerDownLeft className="size-3" aria-hidden /> Jump
        </span>
      </span>
    </button>
  );
}

export function SkeletonRows(): React.ReactElement {
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

export function Kbd({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <kbd className="inline-flex min-w-[18px] items-center justify-center rounded-[5px] border border-[#E5E7EF] bg-white px-1 py-0.5 font-sans text-[10px] leading-none text-[#6B7080] shadow-[0_1px_0_rgba(15,16,35,0.04)]">
      {children}
    </kbd>
  );
}
