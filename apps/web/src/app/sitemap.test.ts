import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  draftMode: async () => ({ isEnabled: false }),
}));

const fetchMock = vi.fn();

const ok = (docs: unknown[]): Response =>
  ({ ok: true, status: 200, json: async () => ({ docs }) }) as Response;
const failed = (status: number): Response =>
  ({ ok: false, status, json: async () => ({}) }) as Response;

const collectionOf = (url: string): string => new URL(url).pathname.replace("/api/", "");

const load = async () => {
  vi.resetModules();
  return (await import("./sitemap")).default;
};

beforeEach(() => {
  globalThis.fetch = fetchMock as never;
  process.env.ALLOW_INDEXING = "1";
  process.env.NEXT_PUBLIC_CMS_URL = "https://cms.test";
});

afterEach(() => {
  fetchMock.mockReset();
  process.env.ALLOW_INDEXING = "";
});

describe("sitemap", () => {
  it("lists static routes and indexable CMS documents, and drops noindex ones", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      collectionOf(url) === "blogs"
        ? ok([
            { slug: "kept", publishedAt: "2025-02-20T00:00:00.000Z" },
            { slug: "hidden", seo: { indexable: "noindex" } },
          ])
        : ok([]),
    );
    const urls = (await (await load())()).map((e) => e.url);
    expect(urls).toContain("https://www.cleanstart.com/pricing");
    expect(urls).toContain("https://www.cleanstart.com/blogs/kept");
    expect(urls).not.toContain("https://www.cleanstart.com/blogs/hidden");
  });

  it("never reports the row-level updatedAt as lastmod", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      collectionOf(url) === "blogs"
        ? ok([
            {
              slug: "bulk-touched",
              publishedAt: "2025-02-20T00:00:00.000Z",
              updatedAt: "2026-08-12T12:05:04.446Z",
            },
            {
              slug: "really-edited",
              publishedAt: "2025-02-20T00:00:00.000Z",
              updatedAt: "2026-08-12T12:05:04.446Z",
              contentUpdatedAt: "2026-03-01T09:00:00.000Z",
            },
          ])
        : ok([]),
    );
    const entries = await (await load())();
    const lastmod = (slug: string): string | undefined => {
      const value = entries.find((e) => e.url.endsWith(`/blogs/${slug}`))?.lastModified;
      return value ? new Date(value).toISOString() : undefined;
    };
    expect(lastmod("bulk-touched")).toBe("2025-02-20T00:00:00.000Z");
    expect(lastmod("really-edited")).toBe("2026-03-01T09:00:00.000Z");
  });

  it("fails loudly when a CMS read errors, so crawlers keep their last good copy", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      collectionOf(url) === "guides" ? failed(502) : ok([]),
    );
    await expect((await load())()).rejects.toThrow(/502/);
  });

  it("fails when the CMS is unreachable", async () => {
    fetchMock.mockRejectedValue(new Error("connect ECONNREFUSED"));
    await expect((await load())()).rejects.toThrow(/ECONNREFUSED/);
  });

  it("is empty where indexing is not allowed", async () => {
    process.env.ALLOW_INDEXING = "";
    expect(await (await load())()).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
