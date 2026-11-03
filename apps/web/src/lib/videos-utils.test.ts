import { describe, expect, it } from "vitest";
import { VIDEO_CATALOG, VIDEO_TOPICS } from "./videos-catalog";
import {
  DEFAULT_VIDEO_FILTERS,
  descriptionParagraphs,
  filterVideos,
  firstParagraph,
  formatCounts,
  isDefaultFilters,
  matchesQuery,
  mergeVideos,
  parseVideoFilters,
  quickStarts,
  sanitizeDescription,
  slugifyTitle,
  topicCounts,
  upNext,
  videoFiltersQuery,
  videoHref,
  type Video,
} from "./videos-utils";
import type { ChannelVideo } from "./youtube-feed";

const must = <T,>(value: T | undefined): T => {
  if (value === undefined) throw new Error("expected a value");
  return value;
};

const all = mergeVideos(VIDEO_CATALOG, []);

const feedEntry = (over: Partial<ChannelVideo> = {}): ChannelVideo => ({
  videoId: "ZZZZZZZZZZZ",
  title: "A Brand New Upload",
  publishedAt: "2026-11-01T10:00:00+00:00",
  thumbnailUrl: "https://i.ytimg.com/vi/ZZZZZZZZZZZ/hqdefault.jpg",
  description: "First paragraph here.\n\nSecond paragraph.\n\n#Tag #Other",
  ...over,
});

describe("catalog invariants", () => {
  it("lists explainers and product demos only", () => {
    expect(new Set(VIDEO_CATALOG.map((v) => v.format))).toEqual(new Set(["explainer", "demo"]));
  });

  it("has unique 11-character ids and unique, URL-safe slugs", () => {
    expect(new Set(VIDEO_CATALOG.map((v) => v.id)).size).toBe(VIDEO_CATALOG.length);
    expect(new Set(VIDEO_CATALOG.map((v) => v.slug)).size).toBe(VIDEO_CATALOG.length);
    for (const v of VIDEO_CATALOG) {
      expect(v.id).toMatch(/^[A-Za-z0-9_-]{11}$/);
      expect(v.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(v.durationSeconds).toBeGreaterThan(0);
      expect(Number.isNaN(Date.parse(v.publishedAt))).toBe(false);
    }
  });

  it("only uses topics from the taxonomy", () => {
    const known = new Set<string>(VIDEO_TOPICS.map((t) => t.id));
    for (const v of VIDEO_CATALOG) for (const t of v.topics) expect(known.has(t)).toBe(true);
  });

  it("carries no em or en dashes in copy", () => {
    for (const v of VIDEO_CATALOG) {
      expect(`${v.title} ${v.summary}`).not.toMatch(/[–—]/);
    }
  });
});

describe("slugifyTitle", () => {
  it("lowercases, drops apostrophes and collapses punctuation", () => {
    expect(slugifyTitle("What's  a Shell-Less Container?!")).toBe("whats-a-shell-less-container");
  });
  it("strips accents and trims to 80 characters without a trailing hyphen", () => {
    expect(slugifyTitle("Café sécurité")).toBe("cafe-securite");
    const long = slugifyTitle("word ".repeat(40));
    expect(long.length).toBeLessThanOrEqual(80);
    expect(long.endsWith("-")).toBe(false);
  });
});

describe("sanitizeDescription", () => {
  it("replaces em and en dashes and collapses blank runs", () => {
    expect(sanitizeDescription("01:29 – Intro\r\n\r\n\r\n\r\nOne — two")).toBe(
      "01:29 - Intro\n\nOne - two",
    );
  });
});

describe("sanitizeDescription lead-ins", () => {
  it("drops a dangling dash after a colon", () => {
    expect(sanitizeDescription("In this video: -  \n\n- One")).toBe("In this video:\n\n- One");
  });
});

describe("firstParagraph", () => {
  it("skips hashtag lines and collapses whitespace", () => {
    expect(firstParagraph("#A #B\n\nHello   there\nfriend.\n\nMore")).toBe("Hello there friend.");
  });
  it("cuts long text at a word boundary", () => {
    const out = firstParagraph("word ".repeat(100), 40);
    expect(out.length).toBeLessThanOrEqual(42);
    expect(out.endsWith("word.")).toBe(true);
  });
});

describe("mergeVideos", () => {
  it("returns the whole catalog newest first when the feed is empty", () => {
    expect(all).toHaveLength(VIDEO_CATALOG.length);
    const dates = all.map((v) => v.publishedAt);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it("keeps catalog title and slug but takes the fresher feed description", () => {
    const entry = must(VIDEO_CATALOG[0]);
    const merged = mergeVideos(VIDEO_CATALOG, [
      feedEntry({ videoId: entry.id, title: "Renamed on YouTube", description: "Fresh – text" }),
    ]);
    const hit = must(merged.find((v) => v.id === entry.id));
    expect(hit.title).toBe(entry.title);
    expect(hit.slug).toBe(entry.slug);
    expect(hit.description).toBe("Fresh - text");
  });

  it("adds an unfiled upload with a derived slug, no format and no duration", () => {
    const merged = mergeVideos(VIDEO_CATALOG, [feedEntry()]);
    const added = must(merged[0]);
    expect(added.slug).toBe("a-brand-new-upload");
    expect(added.format).toBeNull();
    expect(added.durationSeconds).toBeUndefined();
    expect(added.summary).toBe("First paragraph here.");
  });

  it("never reuses a slug already taken by the catalog", () => {
    const taken = must(VIDEO_CATALOG[0]);
    const merged = mergeVideos(VIDEO_CATALOG, [feedEntry({ title: taken.slug.replace(/-/g, " ") })]);
    const slugs = merged.map((v) => v.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("filters", () => {
  it("filters by format and topic together", () => {
    const out = filterVideos(all, { ...DEFAULT_VIDEO_FILTERS, format: "explainer", topic: "sbom" });
    expect(out.length).toBeGreaterThan(0);
    for (const v of out) {
      expect(v.format).toBe("explainer");
      expect(v.topics.map((t) => t.slug)).toContain("sbom");
    }
  });

  it("requires every query word, across title, summary and topic labels", () => {
    expect(matchesQuery(must(all.find((v) => v.slug === "what-is-vex")), "vex sbom")).toBe(true);
    expect(matchesQuery(must(all.find((v) => v.slug === "base-images-explained")), "vex")).toBe(false);
    expect(filterVideos(all, { ...DEFAULT_VIDEO_FILTERS, q: "zzzz-no-match" })).toEqual([]);
  });

  it("sorts shortest first and puts unknown durations last", () => {
    const withUnknown: Video[] = [...all, ...mergeVideos([], [feedEntry()])];
    const out = filterVideos(withUnknown, { ...DEFAULT_VIDEO_FILTERS, sort: "short" });
    expect(must(out[0]).slug).toBe("base-images-explained");
    expect(must(out.at(-1)).durationSeconds).toBeUndefined();
  });

  it("counts formats against the topic and search but not the active format", () => {
    const counts = formatCounts(all, { ...DEFAULT_VIDEO_FILTERS, format: "demo" });
    expect(counts.all).toBe(all.length);
    expect(counts.explainer + counts.demo).toBe(all.length);
  });
});

describe("topics as data", () => {
  it("gives catalog videos topic objects carrying the taxonomy label", () => {
    const vex = must(all.find((v) => v.slug === "what-is-vex"));
    expect(vex.topics).toEqual([
      { slug: "vex", label: "VEX" },
      { slug: "sbom", label: "SBOM" },
      { slug: "cves", label: "CVEs" },
    ]);
  });

  it("counts every topic with a sample video, honouring a given order then count", () => {
    const counts = topicCounts(all, ["vex", "base-images"]);
    expect(counts.slice(0, 2).map((t) => t.slug)).toEqual(["vex", "base-images"]);
    expect(counts.find((t) => t.slug === "base-images")?.count).toBe(6);
    expect(counts.find((t) => t.slug === "vex")?.count).toBe(1);
    const rest = counts.slice(2).map((t) => t.count);
    expect(rest).toEqual([...rest].sort((a, b) => b - a));
  });

  it("works for topics the catalog has never heard of (CMS taxonomy)", () => {
    const cms: Video = { ...must(all[0]), topics: [{ slug: "zero-trust", label: "Zero trust" }] };
    expect(topicCounts([cms])).toEqual([
      { slug: "zero-trust", label: "Zero trust", count: 1, sample: cms },
    ]);
  });

  it("matches the search box against topic labels from the video itself", () => {
    const cms: Video = { ...must(all[0]), title: "Plain", summary: "Plain", topics: [{ slug: "zt", label: "Zero trust" }] };
    expect(matchesQuery(cms, "zero trust")).toBe(true);
    expect(filterVideos([cms], { ...DEFAULT_VIDEO_FILTERS, topic: "zt" })).toEqual([cms]);
    expect(filterVideos([cms], { ...DEFAULT_VIDEO_FILTERS, topic: "other" })).toEqual([]);
  });
});

describe("URL filter state", () => {
  const topics = ["cves", "sbom"];

  it("round-trips valid values and omits defaults", () => {
    const filters = parseVideoFilters((k) => ({ format: "demo", topic: "cves", q: "ide", sort: "old" })[k], topics);
    expect(videoFiltersQuery(filters)).toBe("?q=ide&format=demo&topic=cves&sort=old");
    expect(isDefaultFilters(DEFAULT_VIDEO_FILTERS)).toBe(true);
    expect(videoFiltersQuery(DEFAULT_VIDEO_FILTERS)).toBe("");
  });

  it("ignores unknown formats, topics and sorts", () => {
    const filters = parseVideoFilters((k) => ({ format: "podcast", topic: "nope", sort: "random" })[k], topics);
    expect(filters).toEqual(DEFAULT_VIDEO_FILTERS);
  });

  it("accepts whatever topic slugs the caller says exist, not a fixed list", () => {
    const filters = parseVideoFilters((k) => ({ topic: "zero-trust" })[k], ["zero-trust"]);
    expect(filters.topic).toBe("zero-trust");
    expect(parseVideoFilters((k) => ({ topic: "cves" })[k], ["zero-trust"]).topic).toBeUndefined();
  });
});

const clip = (id: string, over: Partial<Video> = {}): Video => ({
  id,
  slug: id.toLowerCase(),
  title: `Video ${id}`,
  format: "explainer",
  topics: [],
  publishedAt: "2026-10-01T00:00:00Z",
  durationSeconds: 90,
  summary: "",
  description: "",
  thumb: "maxres",
  featured: false,
  ...over,
});

describe("quickStarts", () => {
  it("keeps explainers under two minutes, newest first, up to the limit", () => {
    const pool = [
      clip("a", { publishedAt: "2026-10-01T00:00:00Z" }),
      clip("b", { publishedAt: "2026-10-05T00:00:00Z" }),
      clip("c", { durationSeconds: 120 }),
      clip("d", { format: "demo" }),
      clip("e", { durationSeconds: undefined }),
      clip("f", { format: null }),
      clip("g", { publishedAt: "2026-10-03T00:00:00Z" }),
    ];
    expect(quickStarts(pool, 2).map((v) => v.id)).toEqual(["b", "g"]);
  });

  it("returns nothing when fewer than two qualify, so the row is not shown for one card", () => {
    expect(quickStarts([clip("a"), clip("c", { durationSeconds: 300 })])).toEqual([]);
  });

  it("skips the excluded video", () => {
    const pool = [
      clip("a", { publishedAt: "2026-10-03T00:00:00Z" }),
      clip("b", { publishedAt: "2026-10-02T00:00:00Z" }),
      clip("c", { publishedAt: "2026-10-01T00:00:00Z" }),
    ];
    expect(quickStarts(pool, 4, "a").map((v) => v.id)).toEqual(["b", "c"]);
  });
});

describe("upNext", () => {
  const t = (slug: string) => ({ slug, label: slug });
  const current = clip("cur", { topics: [t("x")], format: "demo", publishedAt: "2026-10-10T00:00:00Z" });

  it("ranks same topic, then same format, then the rest, newest first inside each group", () => {
    const pool = [
      current,
      clip("rest-new", { format: "explainer", publishedAt: "2026-10-09T00:00:00Z" }),
      clip("fmt-old", { format: "demo", publishedAt: "2026-09-01T00:00:00Z" }),
      clip("topic-old", { topics: [t("x")], format: "explainer", publishedAt: "2026-08-01T00:00:00Z" }),
      clip("fmt-new", { format: "demo", publishedAt: "2026-09-20T00:00:00Z" }),
      clip("topic-new", { topics: [t("x")], format: "demo", publishedAt: "2026-09-15T00:00:00Z" }),
    ];
    expect(upNext(pool, current, 10).map((v) => v.id)).toEqual([
      "topic-new",
      "topic-old",
      "fmt-new",
      "fmt-old",
      "rest-new",
    ]);
  });

  it("never lists the current video and honours the limit", () => {
    const pool = [current, clip("a"), clip("b"), clip("c")];
    const out = upNext(pool, current, 2);
    expect(out).toHaveLength(2);
    expect(out.map((v) => v.id)).not.toContain("cur");
  });
});

describe("videoHref", () => {
  it("is the video's own page under /videos", () => {
    expect(videoHref({ slug: "what-is-vex" })).toBe("/videos/what-is-vex");
  });

  it("gives every catalog video a distinct page", () => {
    const hrefs = all.map(videoHref);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});

describe("descriptionParagraphs", () => {
  it("drops hashtag lines and the paragraph that repeats the summary", () => {
    const paragraphs = descriptionParagraphs({
      summary: "First paragraph here.",
      description: "First paragraph here.\n\nSecond paragraph.\n\n#Tag #Other",
    });
    expect(paragraphs).toEqual(["Second paragraph."]);
  });

  it("keeps every paragraph when the description does not open with the summary", () => {
    const paragraphs = descriptionParagraphs({
      summary: "A short card blurb.",
      description: "The long version.\n\nMore detail.",
    });
    expect(paragraphs).toEqual(["The long version.", "More detail."]);
  });

  it("is empty when the description is only the summary", () => {
    expect(descriptionParagraphs({ summary: "Only this.", description: "Only this." })).toEqual([]);
  });
});
