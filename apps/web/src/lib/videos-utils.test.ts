import { describe, expect, it } from "vitest";
import { VIDEO_CATALOG, VIDEO_TOPICS } from "./videos-catalog";
import {
  DEFAULT_VIDEO_FILTERS,
  filterVideos,
  firstParagraph,
  formatCounts,
  isDefaultFilters,
  linkify,
  matchesQuery,
  mergeVideos,
  parseDescription,
  parseVideoFilters,
  relatedVideos,
  sanitizeDescription,
  slugifyTitle,
  topicIndex,
  videoFiltersQuery,
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

describe("parseDescription", () => {
  it("groups bullets and timestamps into lists and drops hashtag lines", () => {
    const blocks = parseDescription(
      "Intro text.\n\n- One\n- Two\n\n01:29 The threat\n03:31 The fix\n\n#SBOM #VEX",
    );
    expect(blocks).toEqual([
      { kind: "text", lines: ["Intro text."] },
      { kind: "list", lines: ["One", "Two"] },
      { kind: "list", lines: ["01:29 The threat", "03:31 The fix"] },
    ]);
  });

  it("turns unbulleted points after a colon lead-in into one list", () => {
    const blocks = parseDescription(
      "In two minutes, this video covers:\n\nWhat VEX is\n\nThe four statuses\n\nWhy a reason matters.\n\nExplore images: https://images.cleanstart.com",
    );
    expect(blocks).toEqual([
      { kind: "text", lines: ["In two minutes, this video covers:"] },
      { kind: "list", lines: ["What VEX is", "The four statuses"] },
      { kind: "text", lines: ["Why a reason matters."] },
      { kind: "text", lines: ["Explore images: https://images.cleanstart.com"] },
    ]);
  });

  it("leaves a single point after a colon as a paragraph", () => {
    expect(parseDescription("Key takeaway:\n\nBuild trust in")).toEqual([
      { kind: "text", lines: ["Key takeaway:"] },
      { kind: "text", lines: ["Build trust in"] },
    ]);
  });

  it("strips pointer emoji from link lines and keeps the text", () => {
    expect(parseDescription("👉 Learn more: https://www.cleanstart.com/\n👉 Book a Demo: https://www.cleanstart.com/book-a-demo")).toEqual([
      {
        kind: "list",
        lines: ["Learn more: https://www.cleanstart.com/", "Book a Demo: https://www.cleanstart.com/book-a-demo"],
      },
    ]);
  });
});

describe("linkify", () => {
  it("links http(s) URLs, trims trailing punctuation, ignores other schemes", () => {
    expect(linkify("See https://www.cleanstart.com/book-a-demo. Or javascript:alert(1)")).toEqual([
      { kind: "text", text: "See " },
      {
        kind: "link",
        text: "https://www.cleanstart.com/book-a-demo",
        href: "https://www.cleanstart.com/book-a-demo",
      },
      { kind: "text", text: ". Or javascript:alert(1)" },
    ]);
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
      expect(v.topics).toContain("sbom");
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
    const counts = formatCounts(all, { ...DEFAULT_VIDEO_FILTERS, format: "talk" });
    expect(counts.all).toBe(all.length);
    expect(counts.explainer + counts.demo + counts.talk).toBe(all.length);
  });
});

describe("topicIndex", () => {
  it("lists only topics that cover at least two videos, most covered first", () => {
    const topics = topicIndex(all);
    expect(topics.every((t) => t.count >= 2)).toBe(true);
    expect(topics.map((t) => t.count)).toEqual([...topics.map((t) => t.count)].sort((a, b) => b - a));
    expect(topics.find((t) => t.id === "ai")).toBeUndefined();
  });
});

describe("relatedVideos", () => {
  it("excludes the video itself and ranks shared topics first", () => {
    const base = must(all.find((v) => v.slug === "what-is-attack-surface-in-containers"));
    const out = relatedVideos(base, all, 4);
    expect(out).toHaveLength(4);
    expect(out.find((v) => v.id === base.id)).toBeUndefined();
    expect(must(out[0]).topics.some((t) => base.topics.includes(t))).toBe(true);
  });
});

describe("URL filter state", () => {
  it("round-trips valid values and omits defaults", () => {
    const filters = parseVideoFilters((k) => ({ format: "demo", topic: "cves", q: "ide", sort: "old" })[k]);
    expect(videoFiltersQuery(filters)).toBe("?q=ide&format=demo&topic=cves&sort=old");
    expect(isDefaultFilters(DEFAULT_VIDEO_FILTERS)).toBe(true);
    expect(videoFiltersQuery(DEFAULT_VIDEO_FILTERS)).toBe("");
  });

  it("ignores unknown formats, topics and sorts", () => {
    const filters = parseVideoFilters((k) => ({ format: "podcast", topic: "nope", sort: "random" })[k]);
    expect(filters).toEqual(DEFAULT_VIDEO_FILTERS);
  });
});
