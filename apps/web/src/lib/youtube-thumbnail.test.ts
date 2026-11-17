import { afterEach, describe, expect, it, vi } from "vitest";
import { bestYoutubeThumbnail } from "./youtube-thumbnail";

const mockFetch = (impl: () => Promise<Response>): void => {
  vi.stubGlobal("fetch", vi.fn(impl));
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("bestYoutubeThumbnail", () => {
  it("keeps maxresdefault when YouTube has it", async () => {
    mockFetch(async () => new Response(null, { status: 200 }));
    expect(await bestYoutubeThumbnail("abc123")).toBe(
      "https://i.ytimg.com/vi/abc123/maxresdefault.jpg",
    );
  });

  it("falls back to hqdefault when maxresdefault is a 404", async () => {
    mockFetch(async () => new Response(null, { status: 404 }));
    expect(await bestYoutubeThumbnail("abc123")).toBe(
      "https://i.ytimg.com/vi/abc123/hqdefault.jpg",
    );
  });

  it("keeps maxresdefault when the check itself fails", async () => {
    mockFetch(async () => {
      throw new Error("network down");
    });
    expect(await bestYoutubeThumbnail("abc123")).toBe(
      "https://i.ytimg.com/vi/abc123/maxresdefault.jpg",
    );
  });
});
