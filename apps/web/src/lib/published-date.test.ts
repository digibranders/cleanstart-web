import { describe, expect, it } from "vitest";

import { effectiveModifiedAt } from "./published-date";

describe("effectiveModifiedAt", () => {
  it("prefers the content timestamp", () => {
    expect(
      effectiveModifiedAt({
        contentUpdatedAt: "2026-03-01T09:00:00.000Z",
        publishedAt: "2025-02-20T00:00:00.000Z",
      }),
    ).toBe("2026-03-01T09:00:00.000Z");
  });

  it("falls back to the publish date, never to updatedAt", () => {
    const doc = {
      publishedAt: "2025-02-20T00:00:00.000Z",
      updatedAt: "2026-08-12T12:05:04.446Z",
    };
    expect(effectiveModifiedAt(doc)).toBe("2025-02-20T00:00:00.000Z");
  });

  it("uses publicationDate for news", () => {
    expect(effectiveModifiedAt({ publicationDate: "2025-06-27T00:00:00.000Z" })).toBe(
      "2025-06-27T00:00:00.000Z",
    );
  });

  it("is undefined with nothing to go on", () => {
    expect(effectiveModifiedAt({})).toBeUndefined();
    expect(effectiveModifiedAt(null)).toBeUndefined();
  });
});
