import { afterEach, describe, expect, it, vi } from "vitest";

import { detailRouteExists } from "./detail-route-not-found-guard";

describe("detailRouteExists", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("leaves dotted file routes alone without asking the CMS", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    await expect(detailRouteExists("/advisories/feed.xml")).resolves.toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("still 404s a bare slug the CMS does not have", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ docs: [] }), { status: 200 })),
    );
    await expect(detailRouteExists("/advisories/no-such-advisory-xyz")).resolves.toBe(false);
  });
});
