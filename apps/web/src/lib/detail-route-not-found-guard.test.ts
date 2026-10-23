import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

const ok = (docs: unknown[]): Response =>
  ({ ok: true, status: 200, json: async () => ({ docs }) }) as Response;

const load = async () => {
  vi.resetModules();
  return (await import("./detail-route-not-found-guard")).detailRouteExists;
};

beforeEach(() => {
  globalThis.fetch = fetchMock as never;
  vi.stubEnv("NEXT_PUBLIC_CMS_URL", "https://cms.test");
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllEnvs();
});

describe("/videos/[slug] guard", () => {
  it("stays out of the way in catalog mode: the CMS has no videos to find", async () => {
    const exists = await load();
    expect(await exists("/videos/what-is-vex")).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  describe("cms mode", () => {
    beforeEach(() => vi.stubEnv("VIDEOS_SOURCE", "cms"));

    it("asks the videos collection for a published document with that slug", async () => {
      fetchMock.mockResolvedValue(ok([{ id: 1 }]));
      expect(await (await load())("/videos/what-is-vex")).toBe(true);
      const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
      expect(url.pathname).toBe("/api/videos");
      expect(url.searchParams.get("where[slug][equals]")).toBe("what-is-vex");
      expect(url.searchParams.get("where[_status][equals]")).toBe("published");
    });

    it("reports a missing slug so the proxy can answer 404", async () => {
      fetchMock.mockResolvedValue(ok([]));
      expect(await (await load())("/videos/no-such-video")).toBe(false);
    });

    it("fails open when the CMS cannot be reached", async () => {
      fetchMock.mockRejectedValue(new Error("down"));
      expect(await (await load())("/videos/anything")).toBe(true);
    });

    it("ignores the listing and nested paths", async () => {
      const exists = await load();
      expect(await exists("/videos")).toBe(true);
      expect(await exists("/videos/a/b")).toBe(true);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
