import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getCmsVideos = vi.fn();
const getChannelVideos = vi.fn();
vi.mock("./videos-cms", () => ({
  getCmsVideos: (...a: unknown[]) => getCmsVideos(...a),
}));
vi.mock("./youtube-feed", () => ({
  getChannelVideos: (...a: unknown[]) => getChannelVideos(...a),
}));

import { VIDEO_CATALOG } from "./videos-catalog";
import { getVideos, videoTopicOrder } from "./videos";

const fromCms = {
  id: "CMSCMSCMSCM",
  slug: "from-the-cms",
  title: "From the CMS",
  format: "explainer",
  topics: [],
  publishedAt: "2026-11-01T00:00:00.000Z",
  durationSeconds: undefined,
  summary: "s",
  description: "d",
  thumb: "maxres",
  featured: false,
} as const;

beforeEach(() => {
  getCmsVideos.mockReset();
  getChannelVideos.mockReset();
  getChannelVideos.mockResolvedValue([]);
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("catalog mode (VIDEOS_SOURCE unset)", () => {
  it("reads the catalog and the RSS feed, never the CMS", async () => {
    const videos = await getVideos();
    expect(videos).toHaveLength(VIDEO_CATALOG.length);
    expect(getChannelVideos).toHaveBeenCalledOnce();
    expect(getCmsVideos).not.toHaveBeenCalled();
  });

  it.each(["", "catalog", "CMS", "yes"])("treats VIDEOS_SOURCE=%j as catalog mode", async (value) => {
    vi.stubEnv("VIDEOS_SOURCE", value);
    await getVideos();
    expect(getCmsVideos).not.toHaveBeenCalled();
  });

  it("keeps the dropdown in the catalog's taxonomy order", () => {
    expect(videoTopicOrder().slice(0, 3)).toEqual(["base-images", "attack-surface", "cves"]);
  });
});

describe("cms mode (VIDEOS_SOURCE=cms)", () => {
  beforeEach(() => vi.stubEnv("VIDEOS_SOURCE", "cms"));

  it("reads the CMS and never touches the RSS feed or the catalog", async () => {
    getCmsVideos.mockResolvedValue([fromCms]);
    expect(await getVideos()).toEqual([fromCms]);
    expect(getChannelVideos).not.toHaveBeenCalled();
  });

  it("lets a CMS failure surface instead of falling back to stale data", async () => {
    getCmsVideos.mockImplementation(async () => {
      throw new Error("CMS fetch failed: 520");
    });
    await expect(getVideos()).rejects.toThrow(/520/);
  });

  it("has no catalog taxonomy order: topics follow their counts", () => {
    expect(videoTopicOrder()).toEqual([]);
  });
});
