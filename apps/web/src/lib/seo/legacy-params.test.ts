import { describe, expect, it } from "vitest";
import { stripLegacyPaginationParams } from "./legacy-params";

describe("stripLegacyPaginationParams", () => {
  it("strips a single Webflow pagination param to a bare path (empty search)", () => {
    expect(stripLegacyPaginationParams("?22c0b585_page=3")).toBe("");
  });

  it("strips every legacy param when several co-occur", () => {
    expect(
      stripLegacyPaginationParams("?22a4e28b_page=1&ec33cd19_page=2"),
    ).toBe("");
  });

  it("is case-insensitive on the hex hash", () => {
    expect(stripLegacyPaginationParams("?AB12CD34_page=2")).toBe("");
  });

  it("keeps co-occurring non-legacy params, dropping only the legacy one", () => {
    expect(
      stripLegacyPaginationParams("?utm_source=x&22c0b585_page=2"),
    ).toBe("?utm_source=x");
  });

  it("returns null (no redirect) for an empty or bare-'?' search", () => {
    expect(stripLegacyPaginationParams("")).toBeNull();
    expect(stripLegacyPaginationParams("?")).toBeNull();
  });

  it("never matches a plain ?page= param", () => {
    expect(stripLegacyPaginationParams("?page=2")).toBeNull();
  });

  it("never matches marketing / search / callback params", () => {
    expect(stripLegacyPaginationParams("?utm_source=news&utm_medium=email"))
      .toBeNull();
    expect(stripLegacyPaginationParams("?q=hello")).toBeNull();
    expect(stripLegacyPaginationParams("?code=oauth_return_token")).toBeNull();
  });

  it("does not match a hash that is too short or too long to be Webflow's", () => {
    // Webflow uses an 8-hex prefix; the guard allows 6–10 to be safe but no more.
    expect(stripLegacyPaginationParams("?abc_page=2")).toBeNull();
    expect(stripLegacyPaginationParams("?0123456789ab_page=2")).toBeNull();
  });

  it("does not match a non-hex prefix ending in _page", () => {
    expect(stripLegacyPaginationParams("?category_page=2")).toBeNull();
  });
});
