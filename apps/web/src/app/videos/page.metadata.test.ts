import { describe, expect, it } from "vitest";

import { VIDEOS_PAGE_PUBLIC } from "@/lib/videos-launch";

// The robots directive is decided by buildPageMetadata's production gate, which is closed
// under test, so this guards the launch flag that page.tsx passes into it.
describe("/videos launch gate", () => {
  it("is public", () => {
    expect(VIDEOS_PAGE_PUBLIC).toBe(true);
  });
});
