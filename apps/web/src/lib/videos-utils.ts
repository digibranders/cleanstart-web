// Client-safe helpers for /videos. No `cms-fetch` or `next/headers` import, so
// the filter bar, cards and player can all use them.

import {
  VIDEO_FORMATS,
  VIDEO_TOPICS,
  type CatalogVideo,
  type VideoFormat,
} from "./videos-catalog";
import type { ChannelVideo } from "./youtube-feed";

/** A topic as the page needs it: the URL slug and the label shown to people. */
export interface VideoTopic {
  readonly slug: string;
  readonly label: string;
}

export interface Video {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  /** `null` is a video nobody has filed yet: it shows under "All" only. */
  readonly format: VideoFormat | null;
  readonly topics: readonly VideoTopic[];
  readonly publishedAt: string;
  readonly durationSeconds: number | undefined;
  /** One short paragraph for cards and the meta description. */
  readonly summary: string;
  /** Full YouTube description, cleaned for display. */
  readonly description: string;
  readonly thumb: "maxres" | "hq";
  /** Plays in the /videos hero. Only the CMS can set it; the catalog never does. */
  readonly featured: boolean;
}

export type VideoSort = "new" | "old" | "short";

export interface VideoFilters {
  readonly format: VideoFormat | undefined;
  readonly topic: string | undefined;
  readonly q: string;
  readonly sort: VideoSort;
}

export const DEFAULT_VIDEO_FILTERS: VideoFilters = {
  format: undefined,
  topic: undefined,
  q: "",
  sort: "new",
};

const SORTS: readonly VideoSort[] = ["new", "old", "short"];
const FORMAT_IDS: readonly string[] = VIDEO_FORMATS.map((f) => f.id);

const catalogTopic = (id: string): VideoTopic => ({
  slug: id,
  label: VIDEO_TOPICS.find((t) => t.id === id)?.label ?? id,
});

export const formatLabel = (id: VideoFormat): string =>
  VIDEO_FORMATS.find((f) => f.id === id)?.singular ?? id;

export const videoCategoryLabel = (video: Pick<Video, "format">): string =>
  video.format ? formatLabel(video.format) : "Video";

/** "Oct 13, 2026". Pinned to UTC so server and browser render the same day. */
export const formatPublished = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

export const slugifyTitle = (title: string): string =>
  title
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");

/**
 * YouTube text is third-party copy on a code-owned page, so it follows the
 * site's no-dash rule on the way in. Also drops control characters and caps
 * runs of blank lines.
 */
const isPrintable = (ch: string): boolean => {
  const code = ch.charCodeAt(0);
  return code === 9 || code === 10 || (code >= 32 && code !== 127);
};

export const sanitizeDescription = (raw: string): string =>
  [...raw.replace(/\r\n?/g, "\n")]
    .filter(isPrintable)
    .join("")
    .replace(/[ \t]*[–—][ \t]*/g, " - ")
    // "In this video: -" style lead-ins leave a dangling marker before the list.
    .replace(/[ \t]+-[ \t]*$/gm, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/** First non-empty paragraph, whitespace collapsed, cut at a word boundary. */
export const firstParagraph = (text: string, max = 320): string => {
  const paragraph =
    text
      .split(/\n\s*\n/)
      .map((p) => p.replace(/\s+/g, " ").trim())
      .find((p) => p.length > 0 && !isHashtagLine(p)) ?? "";
  if (paragraph.length <= max) return paragraph;
  const cut = paragraph.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : max).replace(/[,;:\s]+$/, "")}.`;
};

const isHashtagLine = (line: string): boolean => {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  return tokens.length > 0 && tokens.every((t) => t.startsWith("#"));
};

/**
 * Catalog first, feed second. A catalog entry is the editorial record: its
 * title, slug, format and topics win. The feed refreshes the full description
 * and adds uploads nobody has filed yet.
 */
export const mergeVideos = (
  catalog: readonly CatalogVideo[],
  feed: readonly ChannelVideo[],
): Video[] => {
  const feedById = new Map(feed.map((f) => [f.videoId, f]));
  const known = new Set(catalog.map((c) => c.id));
  const taken = new Set(catalog.map((c) => c.slug));

  const fromCatalog: Video[] = catalog.map((c) => {
    const fromFeed = feedById.get(c.id)?.description;
    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      format: c.format,
      topics: c.topics.map(catalogTopic),
      publishedAt: c.publishedAt,
      durationSeconds: c.durationSeconds,
      summary: c.summary,
      description: fromFeed ? sanitizeDescription(fromFeed) : c.summary,
      thumb: c.thumb ?? "maxres",
      featured: false,
    };
  });

  const fromFeed: Video[] = [];
  for (const f of feed) {
    if (known.has(f.videoId)) continue;
    const base = slugifyTitle(f.title) || f.videoId.toLowerCase();
    const slug = taken.has(base) ? `${base}-${f.videoId.slice(0, 4).toLowerCase()}` : base;
    taken.add(slug);
    const description = sanitizeDescription(f.description);
    fromFeed.push({
      id: f.videoId,
      slug,
      title: f.title,
      format: null,
      topics: [],
      publishedAt: f.publishedAt,
      durationSeconds: undefined,
      summary: firstParagraph(description),
      description,
      thumb: "maxres",
      featured: false,
    });
  }

  return [...fromCatalog, ...fromFeed].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );
};

const SORTERS: Record<VideoSort, (a: Video, b: Video) => number> = {
  new: (a, b) => b.publishedAt.localeCompare(a.publishedAt),
  old: (a, b) => a.publishedAt.localeCompare(b.publishedAt),
  // Videos with no known length sort last.
  short: (a, b) =>
    (a.durationSeconds ?? Number.POSITIVE_INFINITY) -
    (b.durationSeconds ?? Number.POSITIVE_INFINITY),
};

const searchText = (v: Video): string =>
  [v.title, v.summary, ...v.topics.map((t) => t.label)].join(" ").toLowerCase();

/** Every query word must appear in the title, summary or a topic label. */
export const matchesQuery = (video: Video, q: string): boolean => {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = searchText(video);
  return words.every((w) => haystack.includes(w));
};

export const filterVideos = (
  videos: readonly Video[],
  filters: VideoFilters,
): Video[] =>
  videos
    .filter((v) => (filters.format ? v.format === filters.format : true))
    .filter((v) => (filters.topic ? v.topics.some((t) => t.slug === filters.topic) : true))
    .filter((v) => matchesQuery(v, filters.q))
    .sort(SORTERS[filters.sort]);

/** Counts for the format tabs, honouring the topic and search but not the format. */
export const formatCounts = (
  videos: readonly Video[],
  filters: VideoFilters,
): Record<"all" | VideoFormat, number> => {
  const pool = videos
    .filter((v) => (filters.topic ? v.topics.some((t) => t.slug === filters.topic) : true))
    .filter((v) => matchesQuery(v, filters.q));
  const counts: Record<"all" | VideoFormat, number> = {
    all: pool.length,
    explainer: 0,
    demo: 0,
  };
  for (const v of pool) if (v.format) counts[v.format] += 1;
  return counts;
};

export interface TopicCount extends VideoTopic {
  readonly count: number;
  /** The newest video with this topic, used for the tile thumbnail. */
  readonly sample: Video;
}

/**
 * Every topic that at least one video carries, with how many. Topics named in
 * `order` come first in that order (the catalog's taxonomy order); the rest
 * follow, most covered first.
 */
export const topicCounts = (
  videos: readonly Video[],
  order: readonly string[] = [],
): TopicCount[] => {
  const byslug = new Map<string, TopicCount>();
  for (const video of [...videos].sort(SORTERS.new)) {
    for (const topic of video.topics) {
      const seen = byslug.get(topic.slug);
      byslug.set(
        topic.slug,
        seen
          ? { ...seen, count: seen.count + 1 }
          : { slug: topic.slug, label: topic.label, count: 1, sample: video },
      );
    }
  }
  const rank = (slug: string): number => {
    const i = order.indexOf(slug);
    return i === -1 ? Number.POSITIVE_INFINITY : i;
  };
  return [...byslug.values()].sort(
    (a, b) => rank(a.slug) - rank(b.slug) || b.count - a.count || a.label.localeCompare(b.label),
  );
};

type ParamReader = (key: string) => string | null | undefined;

export const parseVideoFilters = (
  read: ParamReader,
  topicSlugs: readonly string[],
): VideoFilters => {
  const format = read("format");
  const topic = read("topic");
  const sort = read("sort");
  return {
    format: format && FORMAT_IDS.includes(format) ? (format as VideoFormat) : undefined,
    topic: topic && topicSlugs.includes(topic) ? topic : undefined,
    q: (read("q") ?? "").slice(0, 80),
    sort: sort && (SORTS as readonly string[]).includes(sort) ? (sort as VideoSort) : "new",
  };
};

/** Query string for the filters, omitting defaults so the clean URL stays clean. */
export const videoFiltersQuery = (filters: VideoFilters): string => {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.format) params.set("format", filters.format);
  if (filters.topic) params.set("topic", filters.topic);
  if (filters.sort !== "new") params.set("sort", filters.sort);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

export const isDefaultFilters = (filters: VideoFilters): boolean =>
  videoFiltersQuery(filters) === "";
