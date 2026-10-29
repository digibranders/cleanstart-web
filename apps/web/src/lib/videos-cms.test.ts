import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchCMS = vi.fn();
vi.mock("./cms-fetch", () => ({
  fetchCMS: (...args: unknown[]) => fetchCMS(...args),
}));

import {
  getCmsVideos,
  mapCmsVideo,
  parseDurationLabel,
} from "./videos-cms";

const doc = (over: Record<string, unknown> = {}) => ({
  id: 7,
  slug: "what-is-vex",
  title: "What Is VEX?",
  externalId: "uBItoX-x7Do",
  format: "explainer" as const,
  topics: [
    { id: 1, slug: "vex", name: "VEX" },
    { id: 2, slug: "sbom", name: "SBOM" },
  ],
  summary: "A short summary.",
  durationLabel: null,
  featured: false,
  publishedAt: "2026-10-13T14:17:14.000Z",
  source: {
    description: "Full text.\n\n01:29 – The threat",
    durationSeconds: 101,
    publishedAt: "2026-10-13T14:17:14.000Z",
    hasMaxres: true,
  },
  ...over,
});

beforeEach(() => {
  fetchCMS.mockReset();
});

describe("parseDurationLabel", () => {
  it.each([
    ["1:41", 101],
    ["0:59", 59],
    ["27:46", 1666],
    ["1:02:10", 3730],
  ])("%s is %i seconds", (label, seconds) => {
    expect(parseDurationLabel(label)).toBe(seconds);
  });

  it.each(["", "  ", "1:2", "abc", "1:41:", null, undefined])("rejects %p", (label) => {
    expect(parseDurationLabel(label)).toBeNull();
  });
});

describe("mapCmsVideo", () => {
  it("maps the CMS shape onto the page's Video", () => {
    expect(mapCmsVideo(doc())).toMatchObject({
      id: "uBItoX-x7Do",
      slug: "what-is-vex",
      title: "What Is VEX?",
      format: "explainer",
      topics: [
        { slug: "vex", label: "VEX" },
        { slug: "sbom", label: "SBOM" },
      ],
      publishedAt: "2026-10-13T14:17:14.000Z",
      durationSeconds: 101,
      summary: "A short summary.",
      thumb: "maxres",
      featured: false,
    });
  });

  it("keeps the site's no-dash rule on text that came from YouTube", () => {
    expect(mapCmsVideo(doc()).description).toBe("Full text.\n\n01:29 - The threat");
  });

  it("drops topics that were not populated (bare ids)", () => {
    expect(mapCmsVideo(doc({ topics: [3, "4", { id: 1, slug: "vex", name: "VEX" }] })).topics).toEqual([
      { slug: "vex", label: "VEX" },
    ]);
  });

  it("uses the poster frame the sync could not find as the 4:3 one", () => {
    expect(mapCmsVideo(doc({ source: { hasMaxres: false } })).thumb).toBe("hq");
  });

  it("takes the typed duration when the sync does not know one", () => {
    const video = mapCmsVideo(doc({ durationLabel: "1:41", source: { durationSeconds: null } }));
    expect(video.durationSeconds).toBe(101);
  });

  it("prefers the synced duration over a typed one", () => {
    expect(mapCmsVideo(doc({ durationLabel: "9:59" })).durationSeconds).toBe(101);
  });

  it("has no duration, not 0, when nothing knows it", () => {
    expect(mapCmsVideo(doc({ source: {}, durationLabel: "nonsense" })).durationSeconds).toBeUndefined();
  });

  it("falls back to the document's own date and summary-as-description", () => {
    const video = mapCmsVideo(doc({ source: {}, publishedAt: "2026-01-02T00:00:00.000Z" }));
    expect(video.publishedAt).toBe("2026-01-02T00:00:00.000Z");
    expect(video.description).toBe("A short summary.");
  });

  it("files an unclassified video under no format", () => {
    expect(mapCmsVideo(doc({ format: null })).format).toBeNull();
  });
});

describe("getCmsVideos", () => {
  it("reads published videos with their topics, newest first, tagged for purging", async () => {
    fetchCMS.mockResolvedValue({
      docs: [
        doc({ slug: "older", externalId: "OLDEROLDER1", source: { publishedAt: "2026-01-01T00:00:00.000Z" } }),
        doc({ slug: "newer", externalId: "NEWERNEWER1", source: { publishedAt: "2026-06-01T00:00:00.000Z" } }),
      ],
    });
    const videos = await getCmsVideos();
    expect(videos.map((v) => v.slug)).toEqual(["newer", "older"]);
    const [path, options] = fetchCMS.mock.calls[0] as [string, { tags: string[] }];
    expect(path).toContain("/api/videos?");
    expect(path).toContain("where%5B_status%5D%5Bequals%5D=published");
    expect(path).toContain("depth=1");
    expect(options.tags).toContain("videos");
  });

  it("skips documents missing a slug or an external id", async () => {
    fetchCMS.mockResolvedValue({ docs: [doc({ slug: "" }), doc({ externalId: undefined }), doc()] });
    expect(await getCmsVideos()).toHaveLength(1);
  });

  it("leaves talks off: they belong to /webinars and /podcast, not this page", async () => {
    fetchCMS.mockResolvedValue({ docs: [doc({ format: "talk" }), doc()] });
    expect(await getCmsVideos()).toHaveLength(1);
  });

  it("lets a CMS failure propagate so ISR keeps the last good page", async () => {
    fetchCMS.mockImplementation(async () => {
      throw new Error("CMS fetch failed: 520");
    });
    await expect(getCmsVideos()).rejects.toThrow(/520/);
  });
});
