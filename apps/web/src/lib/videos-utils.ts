// Client-safe helpers for /videos. No `cms-fetch` or `next/headers` import, so
// the filter bar, cards and player can all use them.

import {
  VIDEO_FORMATS,
  VIDEO_TOPICS,
  type CatalogVideo,
  type VideoFormat,
  type VideoTopicId,
} from "./videos-catalog";
import type { ChannelVideo } from "./youtube-feed";

export interface Video {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  /** `null` is a video nobody has filed yet: it shows under "All" only. */
  readonly format: VideoFormat | null;
  readonly topics: readonly VideoTopicId[];
  readonly publishedAt: string;
  readonly durationSeconds: number | undefined;
  /** One short paragraph for cards and the meta description. */
  readonly summary: string;
  /** Full YouTube description, cleaned for display. */
  readonly description: string;
  readonly thumb: "maxres" | "hq";
}

export type VideoSort = "new" | "old" | "short";

export interface VideoFilters {
  readonly format: VideoFormat | undefined;
  readonly topic: VideoTopicId | undefined;
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
const TOPIC_IDS: readonly string[] = VIDEO_TOPICS.map((t) => t.id);

export const topicLabel = (id: VideoTopicId): string =>
  VIDEO_TOPICS.find((t) => t.id === id)?.label ?? id;

export const formatLabel = (id: VideoFormat): string =>
  VIDEO_FORMATS.find((f) => f.id === id)?.singular ?? id;

export const videoCategoryLabel = (video: Pick<Video, "format">): string =>
  video.format ? formatLabel(video.format) : "Video";

export const videoPath = (slug: string): string => `/videos/${slug}`;

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
    .replace(/[̀-ͯ]/g, "")
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
export const sanitizeDescription = (raw: string): string =>
  raw
    .replace(/\r\n?/g, "\n")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
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

export interface DescriptionBlock {
  readonly kind: "text" | "list";
  readonly lines: readonly string[];
}

const BULLET = /^[-•*→👉▶]+\s*/u;
const LIST_LINE = /^(?:[-•*→👉▶]+\s*|\d{1,2}:\d{2}(?::\d{2})?\s+)\S/u;

/**
 * Splits a cleaned description into paragraphs and lists. Hashtag-only lines
 * are dropped: topics already carry that meaning on the page.
 */
export const parseDescription = (description: string): DescriptionBlock[] => {
  const blocks: DescriptionBlock[] = [];
  for (const chunk of description.split(/\n\s*\n/)) {
    const lines = chunk
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !isHashtagLine(l));
    if (lines.length === 0) continue;
    const listed = lines.filter((l) => LIST_LINE.test(l));
    if (listed.length === lines.length) {
      blocks.push({
        kind: "list",
        lines: lines.map((l) => l.replace(BULLET, "")),
      });
    } else {
      blocks.push({ kind: "text", lines });
    }
  }
  return groupLeadInItems(blocks);
};

const SENTENCE_END = /[.!?]["”')\]]*$/;

/**
 * YouTube editors often write "In this video:" and then put each point on its
 * own line with blank lines between and no bullet. Group those points into one
 * list. Only short single lines that do not end like a sentence and carry no
 * link qualify, so a closing "Learn more: https://..." line stays a paragraph.
 */
const groupLeadInItems = (blocks: DescriptionBlock[]): DescriptionBlock[] => {
  const out: DescriptionBlock[] = [];
  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i]!;
    out.push(block);
    const last = block.lines.at(-1) ?? "";
    if (block.kind !== "text" || !last.endsWith(":")) continue;
    const items: string[] = [];
    let j = i + 1;
    while (j < blocks.length) {
      const next = blocks[j]!;
      const line = next.lines[0] ?? "";
      const qualifies =
        next.kind === "text" &&
        next.lines.length === 1 &&
        line.length < 160 &&
        !SENTENCE_END.test(line) &&
        !/https?:\/\//.test(line);
      if (!qualifies) break;
      items.push(line);
      j += 1;
    }
    if (items.length >= 2) {
      out.push({ kind: "list", lines: items });
      i = j - 1;
    }
  }
  return out;
};

export type LinkSegment =
  | { readonly kind: "text"; readonly text: string }
  | { readonly kind: "link"; readonly text: string; readonly href: string };

const URL_RE = /https?:\/\/[^\s<>"']+/g;

/** Turns bare http(s) URLs into link segments. Nothing else becomes a link. */
export const linkify = (text: string): LinkSegment[] => {
  const out: LinkSegment[] = [];
  let last = 0;
  for (const match of text.matchAll(URL_RE)) {
    const start = match.index ?? 0;
    const trimmed = match[0].replace(/[.,;:!?)\]]+$/, "");
    if (start > last) out.push({ kind: "text", text: text.slice(last, start) });
    out.push({ kind: "link", text: trimmed, href: trimmed });
    last = start + trimmed.length;
  }
  if (last < text.length) out.push({ kind: "text", text: text.slice(last) });
  return out;
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
      topics: c.topics,
      publishedAt: c.publishedAt,
      durationSeconds: c.durationSeconds,
      summary: c.summary,
      description: fromFeed ? sanitizeDescription(fromFeed) : c.summary,
      thumb: c.thumb ?? "maxres",
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
  [v.title, v.summary, ...v.topics.map(topicLabel)].join(" ").toLowerCase();

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
    .filter((v) => (filters.topic ? v.topics.includes(filters.topic) : true))
    .filter((v) => matchesQuery(v, filters.q))
    .sort(SORTERS[filters.sort]);

/** Counts for the format tabs, honouring the topic and search but not the format. */
export const formatCounts = (
  videos: readonly Video[],
  filters: VideoFilters,
): Record<"all" | VideoFormat, number> => {
  const pool = videos
    .filter((v) => (filters.topic ? v.topics.includes(filters.topic) : true))
    .filter((v) => matchesQuery(v, filters.q));
  const counts: Record<"all" | VideoFormat, number> = {
    all: pool.length,
    explainer: 0,
    demo: 0,
    talk: 0,
  };
  for (const v of pool) if (v.format) counts[v.format] += 1;
  return counts;
};

/** Topics that cover at least `min` videos, most covered first. */
export const topicIndex = (
  videos: readonly Video[],
  min = 2,
): Array<{ id: VideoTopicId; label: string; count: number; sample: Video }> => {
  const out: Array<{ id: VideoTopicId; label: string; count: number; sample: Video }> = [];
  for (const { id, label } of VIDEO_TOPICS) {
    const matching = videos.filter((v) => v.topics.includes(id));
    const sample = matching[0];
    if (sample && matching.length >= min) {
      out.push({ id, label, count: matching.length, sample });
    }
  }
  return out.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
};

/** Same-topic videos first, then same-format, newest breaking ties. */
export const relatedVideos = (
  video: Video,
  all: readonly Video[],
  limit = 6,
): Video[] => {
  const score = (v: Video): number =>
    v.topics.filter((t) => video.topics.includes(t)).length * 2 +
    (v.format !== null && v.format === video.format ? 1 : 0);
  return all
    .filter((v) => v.id !== video.id)
    .sort((a, b) => score(b) - score(a) || b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit);
};

type ParamReader = (key: string) => string | null | undefined;

export const parseVideoFilters = (read: ParamReader): VideoFilters => {
  const format = read("format");
  const topic = read("topic");
  const sort = read("sort");
  return {
    format: format && FORMAT_IDS.includes(format) ? (format as VideoFormat) : undefined,
    topic: topic && TOPIC_IDS.includes(topic) ? (topic as VideoTopicId) : undefined,
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
