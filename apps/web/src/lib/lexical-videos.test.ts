import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LexicalRoot } from "@/lib/blog";
import type { Video } from "./videos-utils";

const getCmsVideosByIds = vi.fn();
vi.mock("./videos-cms", () => ({
  getCmsVideosByIds: (...args: unknown[]) => getCmsVideosByIds(...args),
}));

import { applyVideos, collectVideoIds, resolveLexicalVideos } from "./lexical-videos";

const video = (over: Partial<Video> = {}): Video => ({
  id: "uBItoX-x7Do",
  slug: "what-is-vex",
  title: "What Is VEX?",
  format: "explainer",
  topics: [],
  publishedAt: "2026-10-13T14:17:14.000Z",
  durationSeconds: 101,
  summary: "",
  description: "",
  thumb: "maxres",
  featured: false,
  ...over,
});

const para = (text: string): unknown => ({ type: "paragraph", children: [{ type: "text", text }] });
const block = (videoRef: unknown, caption = ""): unknown => ({
  type: "block",
  version: 2,
  fields: { blockType: "videoEmbed", video: videoRef, caption },
});
const doc = (...children: unknown[]): LexicalRoot => ({ root: { type: "root", children } }) as unknown as LexicalRoot;

beforeEach(() => getCmsVideosByIds.mockReset());

describe("collectVideoIds", () => {
  it("reads ids whether the video arrived as an id or a populated doc", () => {
    expect(collectVideoIds(doc(para("a"), block(7), block({ id: 9, title: "x" }), block("7")))).toEqual(["7", "9"]);
  });

  it("finds blocks nested inside other nodes", () => {
    const nested = { type: "list", children: [{ type: "listitem", children: [block(4)] }] };
    expect(collectVideoIds(doc(nested))).toEqual(["4"]);
  });

  it("ignores other blocks and an empty pick", () => {
    const cta = { type: "block", fields: { blockType: "inlineCta", heading: "x" } };
    expect(collectVideoIds(doc(cta, block(null)))).toEqual([]);
  });
});

describe("applyVideos", () => {
  it("writes the video onto its block and leaves the rest alone", () => {
    const out = applyVideos(doc(para("a"), block(7, "Watch this")), new Map([["7", video()]]));
    const fields = (out.root.children[1] as unknown as { fields: Record<string, unknown> }).fields;
    expect(fields._video).toEqual({ id: "uBItoX-x7Do", title: "What Is VEX?", thumb: "maxres", durationSeconds: 101 });
    expect(fields.caption).toBe("Watch this");
    expect(out.root.children).toHaveLength(2);
  });

  it("removes a block whose video is gone, so no empty gap or broken player is left", () => {
    const out = applyVideos(doc(para("a"), block(8), para("b")), new Map());
    expect(out.root.children).toHaveLength(2);
  });

  it("does not change the content it was given", () => {
    const input = doc(block(7));
    applyVideos(input, new Map([["7", video()]]));
    expect((input.root.children[0] as unknown as { fields: Record<string, unknown> }).fields._video).toBeUndefined();
  });
});

describe("resolveLexicalVideos", () => {
  it("makes no request for content with no video block, and returns it as is", async () => {
    const input = doc(para("a"));
    expect(await resolveLexicalVideos(input)).toBe(input);
    expect(getCmsVideosByIds).not.toHaveBeenCalled();
  });

  it("passes empty content through", async () => {
    expect(await resolveLexicalVideos(null)).toBeNull();
    expect(await resolveLexicalVideos(undefined)).toBeUndefined();
  });

  it("asks once for every video in the page, then fills them in", async () => {
    getCmsVideosByIds.mockResolvedValue(new Map([["7", video()], ["9", video({ id: "zzz" })]]));
    const out = await resolveLexicalVideos(doc(block(7), para("a"), block(9)));
    expect(getCmsVideosByIds).toHaveBeenCalledTimes(1);
    expect(getCmsVideosByIds).toHaveBeenCalledWith(["7", "9"]);
    expect(out?.root.children).toHaveLength(3);
  });
});
