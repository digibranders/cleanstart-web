// apps/web/src/app/api/og/render.test.ts
import { describe, it, expect } from "vitest";
import { pickTitleSize, splitTitleAccent } from "./render";

describe("pickTitleSize", () => {
  it("scales the default variant down as length grows", () => {
    expect(pickTitleSize("x".repeat(55), "default")).toBe(60);
    expect(pickTitleSize("x".repeat(56), "default")).toBe(52);
    expect(pickTitleSize("x".repeat(81), "default")).toBe(46);
  });
  it("uses larger hero sizes", () => {
    expect(pickTitleSize("x".repeat(40), "hero")).toBe(76);
    expect(pickTitleSize("x".repeat(41), "hero")).toBe(64);
  });
});

describe("splitTitleAccent", () => {
  it("splits the title at the accent phrase", () => {
    expect(splitTitleAccent("Trusted Container Foundations", "Foundations"))
      .toEqual({ lead: "Trusted Container ", accent: "Foundations" });
  });
  it("returns all-lead when no accent given", () => {
    expect(splitTitleAccent("plain title")).toEqual({ lead: "plain title", accent: "" });
  });
  it("returns all-lead when accent not found", () => {
    expect(splitTitleAccent("plain title", "missing")).toEqual({ lead: "plain title", accent: "" });
  });
  it("is case-insensitive and keeps original casing", () => {
    expect(splitTitleAccent("The Big Reveal", "big reveal").accent).toBe("Big Reveal");
  });
});
