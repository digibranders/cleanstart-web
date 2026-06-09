import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseYouTubeFeed } from "./youtube-feed";

const fixture = readFileSync(
  join(__dirname, "__fixtures__/youtube-feed.xml"),
  "utf8",
);

describe("parseYouTubeFeed", () => {
  it("extracts videoId, title and publishedAt per entry, capped to limit", () => {
    const videos = parseYouTubeFeed(fixture, 2);
    expect(videos).toHaveLength(2);
    expect(videos[0]).toEqual({
      videoId: "GqFPH4KKqpA",
      title: "CleanSight: A Complete software security posture management",
      publishedAt: "2026-05-27T13:36:30+00:00",
      thumbnailUrl: "https://i.ytimg.com/vi/GqFPH4KKqpA/hqdefault.jpg",
    });
  });

  it("decodes XML entities in titles", () => {
    const videos = parseYouTubeFeed(fixture, 10);
    expect(videos[1]?.title).toBe("Supply chain & SBOM: what's changed");
  });

  it("derives the thumbnail from the videoId (ignores feed media:thumbnail host)", () => {
    const videos = parseYouTubeFeed(fixture, 1);
    expect(videos[0]?.thumbnailUrl).toContain(
      "https://i.ytimg.com/vi/GqFPH4KKqpA/",
    );
  });

  it("returns [] for empty or malformed input", () => {
    expect(parseYouTubeFeed("", 6)).toEqual([]);
    expect(parseYouTubeFeed("<feed></feed>", 6)).toEqual([]);
    expect(parseYouTubeFeed("not xml at all", 6)).toEqual([]);
  });

  it("skips entries missing a videoId", () => {
    const broken = "<feed><entry><title>no id</title></entry></feed>";
    expect(parseYouTubeFeed(broken, 6)).toEqual([]);
  });
});
