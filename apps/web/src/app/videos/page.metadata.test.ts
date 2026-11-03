import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ draftMode: async () => ({ isEnabled: false }) }));

import { VIDEOS_PAGE_PUBLIC } from "@/lib/videos-launch";
import { generateMetadata } from "./page";

describe("/videos launch gate", () => {
  it("is not public yet", () => {
    expect(VIDEOS_PAGE_PUBLIC).toBe(false);
  });

  it("is noindex and nofollow until it is made public", () => {
    const robots = generateMetadata().robots;
    expect(robots).toMatchObject({ index: false, follow: false });
  });
});
