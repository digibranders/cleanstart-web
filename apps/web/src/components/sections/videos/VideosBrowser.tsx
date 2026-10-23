"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Container } from "@/components/layout";
import { VIDEO_FORMATS, VIDEO_TOPICS } from "@/lib/videos-catalog";
import {
  DEFAULT_VIDEO_FILTERS,
  filterVideos,
  formatCounts,
  isDefaultFilters,
  parseVideoFilters,
  topicLabel,
  videoFiltersQuery,
  type Video,
  type VideoFilters,
  type VideoSort,
} from "@/lib/videos-utils";
import { VideoCard } from "./VideoCard";

export const VIDEOS_PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 250;

const SORT_OPTIONS: ReadonlyArray<{ value: VideoSort; label: string }> = [
  { value: "new", label: "Newest first" },
  { value: "old", label: "Oldest first" },
  { value: "short", label: "Shortest first" },
];

const CONTROL =
  "h-11 rounded-[12px] border border-[rgba(18,16,28,0.18)] bg-white px-3 font-sans text-[#12101C] outline-none transition-[border-color,box-shadow] duration-200 focus-visible:border-[#5B2EE0] focus-visible:shadow-[0_0_0_4px_rgba(91,46,224,0.14)] motion-reduce:transition-none";

interface VideosViewProps {
  videos: readonly Video[];
  /** The video playing in the hero. Left out of the unfiltered grid so it is not shown twice. */
  heroId: string | null;
  filters: VideoFilters;
  onChange: (next: VideoFilters) => void;
}

function VideosView({ videos, heroId, filters, onChange }: VideosViewProps): React.ReactElement {
  const searchRef = useRef<HTMLInputElement>(null);

  // The search box is local state so typing never waits on the URL. These three
  // values stop a debounced push from overwriting characters typed after it,
  // while still adopting changes that arrive from elsewhere (Clear all, Back).
  const [draft, setDraft] = useState(filters.q);
  const [pushedQ, setPushedQ] = useState(filters.q);
  const [seenUrlQ, setSeenUrlQ] = useState(filters.q);
  if (filters.q !== seenUrlQ) {
    setSeenUrlQ(filters.q);
    if (filters.q !== pushedQ) {
      setPushedQ(filters.q);
      setDraft(filters.q);
    }
  }

  useEffect(() => {
    if (draft === pushedQ) return;
    const timer = window.setTimeout(() => {
      setPushedQ(draft);
      onChange({ ...filters, q: draft });
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [draft, pushedQ, filters, onChange]);

  // "/" jumps to search, unless the visitor is already typing somewhere.
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const el = event.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filterKey = videoFiltersQuery(filters);
  const [pageState, setPageState] = useState({ key: filterKey, count: VIDEOS_PAGE_SIZE });
  const visibleCount = pageState.key === filterKey ? pageState.count : VIDEOS_PAGE_SIZE;

  const results = useMemo(() => filterVideos(videos, filters), [videos, filters]);
  const list = useMemo(
    () => (isDefaultFilters(filters) ? results.filter((v) => v.id !== heroId) : results),
    [results, filters, heroId],
  );
  const counts = useMemo(() => formatCounts(videos, filters), [videos, filters]);
  const topicCounts = useMemo(
    () =>
      VIDEO_TOPICS.map((t) => ({
        ...t,
        count: videos.filter((v) => v.topics.includes(t.id)).length,
      })).filter((t) => t.count > 0),
    [videos],
  );

  const shown = list.slice(0, visibleCount);
  const remaining = list.length - shown.length;
  const hasActiveFilter = !isDefaultFilters(filters);
  const noun = list.length === 1 ? "video" : "videos";

  const set = (patch: Partial<VideoFilters>): void => onChange({ ...filters, ...patch });
  const clearAll = (): void => onChange(DEFAULT_VIDEO_FILTERS);

  const submitSearch = (event: React.FormEvent): void => {
    event.preventDefault();
    setPushedQ(draft);
    onChange({ ...filters, q: draft });
    document.getElementById("library-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section id="library" aria-labelledby="library-title" style={{ scrollMarginTop: "var(--cs-header-h)" }}>
      <h2 id="library-title" className="sr-only">
        All videos
      </h2>

      <div className="z-30 border-b border-[rgba(18,16,28,0.08)] bg-white/92 backdrop-blur-md md:sticky md:top-[var(--cs-header-h)]">
        <Container className="flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div
            role="group"
            aria-label="Filter by format"
            className="-mx-6 flex gap-1.5 overflow-x-auto px-6 pb-1 [scrollbar-width:none] sm:-mx-10 sm:px-10 lg:mx-0 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden"
          >
            {[
              { id: undefined, label: "All", count: counts.all },
              ...VIDEO_FORMATS.map((f) => ({ id: f.id, label: f.label, count: counts[f.id] })),
            ].map((tab) => {
              const on = filters.format === tab.id;
              return (
                <button
                  key={tab.label}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set({ format: tab.id })}
                  className={`inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 font-sans text-[15px] font-medium transition-colors duration-200 motion-reduce:transition-none ${
                    on ? "bg-[#151021] text-white" : "text-[#3D3A4F] hover:bg-[#F1EFF8]"
                  }`}
                >
                  {tab.label}
                  <span className="text-[12px] tabular-nums opacity-70">{tab.count}</span>
                </button>
              );
            })}
          </div>

          <form
            role="search"
            onSubmit={submitSearch}
            className="flex flex-wrap items-center gap-2 sm:flex-nowrap"
          >
            <label className="sr-only" htmlFor="videos-topic">
              Topic
            </label>
            <select
              id="videos-topic"
              value={filters.topic ?? ""}
              onChange={(e) =>
                set({ topic: parseVideoFilters((k) => (k === "topic" ? e.target.value : null)).topic })
              }
              className={`${CONTROL} min-w-0 flex-1 text-[14px] sm:flex-none`}
            >
              <option value="">All topics</option>
              {topicCounts.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label} ({t.count})
                </option>
              ))}
            </select>

            <div className="relative order-first w-full sm:order-none sm:w-[240px]">
              <label className="sr-only" htmlFor="videos-search">
                Search videos
              </label>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6E6A82"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden
                className="pointer-events-none absolute left-3.5 top-3.5"
              >
                <circle cx="11" cy="11" r="6.5" />
                <path d="M20 20l-4.2-4.2" />
              </svg>
              <input
                ref={searchRef}
                id="videos-search"
                type="search"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Search videos"
                autoComplete="off"
                maxLength={80}
                className={`${CONTROL} w-full pl-10 pr-9 text-[16px] placeholder:text-[#6E6A82] md:text-[14px]`}
              />
              <kbd
                aria-hidden
                className={`pointer-events-none absolute right-3 top-3 hidden h-5 min-w-5 items-center justify-center rounded border border-[rgba(18,16,28,0.2)] px-1 font-sans text-[11px] text-[#5B5870] lg:inline-flex ${draft ? "lg:hidden" : ""}`}
              >
                /
              </kbd>
            </div>

            <label className="sr-only" htmlFor="videos-sort">
              Sort
            </label>
            <select
              id="videos-sort"
              value={filters.sort}
              onChange={(e) =>
                set({ sort: parseVideoFilters((k) => (k === "sort" ? e.target.value : null)).sort })
              }
              className={`${CONTROL} min-w-0 flex-1 text-[14px] sm:flex-none`}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </form>
        </Container>
      </div>

      <Container
        id="library-results"
        className="pb-[var(--spacing-section-md)] pt-8"
        style={{ scrollMarginTop: "calc(var(--cs-header-h) + 76px)" }}
      >
        <div className="mb-7 flex flex-wrap items-center gap-x-3 gap-y-2">
          <p
            aria-live="polite"
            className="font-sans font-medium text-[#5B5870]"
            style={{ fontSize: "var(--fs-body-sm)" }}
          >
            {hasActiveFilter
              ? `${list.length} ${noun}`
              : `Showing ${shown.length} of ${list.length} ${noun}`}
          </p>
          {filters.topic ? (
            <RemovableChip
              label={`Topic: ${topicLabel(filters.topic)}`}
              onRemove={() => set({ topic: undefined })}
            />
          ) : null}
          {filters.q.trim() ? (
            <RemovableChip label={`Search: ${filters.q.trim()}`} onRemove={() => set({ q: "" })} />
          ) : null}
          {hasActiveFilter ? (
            <button
              type="button"
              onClick={clearAll}
              className="cursor-pointer font-sans text-[14px] font-medium text-[#5B2EE0] underline underline-offset-4 hover:text-[#3A1BA8]"
            >
              Clear all
            </button>
          ) : null}
        </div>

        {shown.length > 0 ? (
          <ul className="grid grid-cols-1 gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((video) => (
              <li key={video.id}>
                <VideoCard video={video} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-[rgba(18,16,28,0.18)] px-6 py-16 text-center">
            <p className="font-display text-[22px] font-semibold text-[#12101C]">
              No videos match that yet
            </p>
            <p className="max-w-[420px] font-sans text-[15px] text-[#5B5870]">
              Try a broader word, or clear the filters to see every video.
            </p>
            <button
              type="button"
              onClick={clearAll}
              className="mt-2 inline-flex h-11 cursor-pointer items-center rounded-full border border-[rgba(18,16,28,0.18)] bg-white px-5 font-sans text-[15px] font-medium text-[#12101C] hover:border-[#5B2EE0] hover:text-[#5B2EE0]"
            >
              Clear all filters
            </button>
          </div>
        )}

        {remaining > 0 ? (
          <div className="mt-14 flex justify-center">
            <button
              type="button"
              onClick={() =>
                setPageState({ key: filterKey, count: visibleCount + VIDEOS_PAGE_SIZE })
              }
              className="inline-flex h-12 cursor-pointer items-center rounded-full border border-[rgba(18,16,28,0.18)] bg-white px-6 font-sans text-[15px] font-medium text-[#12101C] transition-colors duration-200 hover:border-[#5B2EE0] hover:text-[#5B2EE0] active:translate-y-px motion-reduce:transition-none"
            >
              Show {Math.min(VIDEOS_PAGE_SIZE, remaining)} more
            </button>
          </div>
        ) : null}
      </Container>
    </section>
  );
}

function RemovableChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}): React.ReactElement {
  return (
    <span className="inline-flex h-8 items-center gap-1 rounded-full bg-[#F1EFF8] pl-3 pr-1 font-sans text-[13px] font-medium text-[#3D3A4F]">
      <span className="max-w-[200px] truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter ${label}`}
        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full hover:bg-[#E3DEF3]"
      >
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </span>
  );
}

interface VideosBrowserProps {
  videos: Video[];
  heroId: string | null;
}

/**
 * Client driver for /videos. Reads the filters from the URL and applies them in
 * memory, so the route stays static. Must sit inside `<Suspense>`, with
 * `VideosBrowserFallback` as the fallback so crawlers get the default view.
 */
export function VideosBrowser({ videos, heroId }: VideosBrowserProps): React.ReactElement {
  const params = useSearchParams();
  const router = useRouter();
  const filters = useMemo(() => parseVideoFilters((key) => params.get(key)), [params]);
  const onChange = useMemo(
    () =>
      (next: VideoFilters): void =>
        router.replace(`/videos${videoFiltersQuery(next)}`, { scroll: false }),
    [router],
  );
  return <VideosView videos={videos} heroId={heroId} filters={filters} onChange={onChange} />;
}

const noop = (): void => undefined;

/** The unfiltered first view, rendered into the static HTML. */
export function VideosBrowserFallback({ videos, heroId }: VideosBrowserProps): React.ReactElement {
  return (
    <VideosView videos={videos} heroId={heroId} filters={DEFAULT_VIDEO_FILTERS} onChange={noop} />
  );
}
