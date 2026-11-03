import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CLEANSTART_YOUTUBE_CHANNEL_ID,
  CLEANSTART_YOUTUBE_SUBSCRIBE_URL,
  parseYouTubeFeed,
} from "./youtube-feed";

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
      description: "",
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

  it("reads media:description with its line breaks and entities decoded", () => {
    const xml =
      "<feed><entry><yt:videoId>ABCDEFGHIJK</yt:videoId><title>t</title>" +
      "<published>2026-01-01T00:00:00+00:00</published><media:group>" +
      "<media:description>Line one &amp; two.\n\nLine three</media:description>" +
      "</media:group></entry></feed>";
    expect(parseYouTubeFeed(xml, 1)[0]?.description).toBe(
      "Line one & two.\n\nLine three",
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

describe("CLEANSTART_YOUTUBE_SUBSCRIBE_URL", () => {
  it("points at the channel id and asks YouTube to show its subscribe prompt", () => {
    const url = new URL(CLEANSTART_YOUTUBE_SUBSCRIBE_URL);
    expect(url.origin).toBe("https://www.youtube.com");
    expect(url.pathname).toBe(`/channel/${CLEANSTART_YOUTUBE_CHANNEL_ID}`);
    expect(url.searchParams.get("sub_confirmation")).toBe("1");
  });
});
