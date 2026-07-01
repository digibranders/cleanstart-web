import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { Blog, LexicalRoot } from "./blog";

const fetchCMS = vi.fn();

vi.mock("./cms-fetch", () => ({
  fetchCMS: (...args: unknown[]) => fetchCMS(...args),
  cmsBaseUrl: () => "http://localhost:3000",
}));

const { getRelatedBlogs, getAutoJourneyTargets, isLexicalBodyEmpty } = await import("./blog");

const mkRoot = (children: unknown[]): LexicalRoot =>
  ({
    root: { type: "root", children, direction: "ltr", format: "", indent: 0, version: 1 },
  }) as LexicalRoot;

interface FakeBlog {
  id: string;
  slug: string;
  title: string;
}

const mkBlog = (id: string): FakeBlog => ({
  id,
  slug: `post-${id}`,
  title: `Post ${id}`,
});

const mkResponse = <T,>(docs: T[]) => ({
  docs,
  totalDocs: docs.length,
  hasNextPage: false,
  nextPage: null,
  page: 1,
  totalPages: 1,
});

beforeEach(() => {
  fetchCMS.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getRelatedBlogs", () => {
  test("0 curated, category yields 3 → returns the 3 category posts", async () => {
    fetchCMS.mockResolvedValueOnce(
      mkResponse<FakeBlog>([mkBlog("c1"), mkBlog("c2"), mkBlog("c3")]),
    );
    const out = await getRelatedBlogs("self", ["cat-1"], null);
    expect(fetchCMS).toHaveBeenCalledTimes(1);
    expect(out.map((b: Blog) => b.id)).toEqual(["c1", "c2", "c3"]);
  });

  test("0 curated, category yields 0, site-wide fills → returns site-wide latest", async () => {
    fetchCMS
      .mockResolvedValueOnce(mkResponse<FakeBlog>([])) // category fill — empty
      .mockResolvedValueOnce(
        mkResponse<FakeBlog>([mkBlog("s1"), mkBlog("s2"), mkBlog("s3")]),
      ); // site-wide
    const out = await getRelatedBlogs("self", ["cat-1"], null);
    expect(fetchCMS).toHaveBeenCalledTimes(2);
    expect(out.map((b: Blog) => b.id)).toEqual(["s1", "s2", "s3"]);
  });

  test("1 curated + 2 category fill → curated first, fill in date order", async () => {
    fetchCMS
      .mockResolvedValueOnce(mkResponse<FakeBlog>([mkBlog("cur1")]))
      .mockResolvedValueOnce(
        mkResponse<FakeBlog>([mkBlog("c1"), mkBlog("c2"), mkBlog("c3")]),
      );
    const out = await getRelatedBlogs("self", ["cat-1"], ["cur1"]);
    expect(fetchCMS).toHaveBeenCalledTimes(2);
    expect(out.map((b: Blog) => b.id)).toEqual(["cur1", "c1", "c2"]);
  });

  test("3 curated → no fill query fires", async () => {
    fetchCMS.mockResolvedValueOnce(
      mkResponse<FakeBlog>([mkBlog("cur1"), mkBlog("cur2"), mkBlog("cur3")]),
    );
    const out = await getRelatedBlogs(
      "self",
      ["cat-1"],
      ["cur1", "cur2", "cur3"],
    );
    expect(fetchCMS).toHaveBeenCalledTimes(1);
    expect(out.map((b: Blog) => b.id)).toEqual(["cur1", "cur2", "cur3"]);
  });

  test("curated includes an unpublished doc → drops out, fill compensates", async () => {
    fetchCMS
      .mockResolvedValueOnce(
        mkResponse<FakeBlog>([mkBlog("cur1"), mkBlog("cur3")]),
      )
      .mockResolvedValueOnce(mkResponse<FakeBlog>([mkBlog("c1")]));
    const out = await getRelatedBlogs(
      "self",
      ["cat-1"],
      ["cur1", "cur2", "cur3"],
    );
    expect(fetchCMS).toHaveBeenCalledTimes(2);
    expect(out.map((b: Blog) => b.id)).toEqual(["cur1", "cur3", "c1"]);
  });

  test("curated + category fill overlap on same id → deduped, no double-count", async () => {
    fetchCMS
      .mockResolvedValueOnce(mkResponse<FakeBlog>([mkBlog("cur1")]))
      .mockResolvedValueOnce(
        mkResponse<FakeBlog>([mkBlog("cur1"), mkBlog("c2")]),
      )
      .mockResolvedValueOnce(mkResponse<FakeBlog>([mkBlog("s3")]));
    const out = await getRelatedBlogs("self", ["cat-1"], ["cur1"]);
    expect(out.map((b: Blog) => b.id)).toEqual(["cur1", "c2", "s3"]);
  });

  test("self id never appears in result even if returned by server", async () => {
    fetchCMS
      .mockResolvedValueOnce(mkResponse<FakeBlog>([])) // curated query (none after self-filter)
      .mockResolvedValueOnce(
        mkResponse<FakeBlog>([mkBlog("c1"), mkBlog("c2"), mkBlog("c3")]),
      );
    const out = await getRelatedBlogs("self", ["cat-1"], ["self"]);
    expect(out.map((b: Blog) => b.id)).not.toContain("self");
    expect(out.map((b: Blog) => b.id)).toEqual(["c1", "c2", "c3"]);
  });

  test("hydrated curated docs (Blog objects, depth>=1) work the same as id strings", async () => {
    fetchCMS
      .mockResolvedValueOnce(mkResponse<FakeBlog>([mkBlog("cur1")]))
      .mockResolvedValueOnce(
        mkResponse<FakeBlog>([mkBlog("c1"), mkBlog("c2")]),
      );
    const curated = [mkBlog("cur1") as unknown as Blog];
    const out = await getRelatedBlogs("self", ["cat-1"], curated);
    expect(out.map((b: Blog) => b.id)).toEqual(["cur1", "c1", "c2"]);
  });

  test("numeric Payload ids in curated array are normalized", async () => {
    fetchCMS
      .mockResolvedValueOnce(
        mkResponse<FakeBlog>([{ id: "42", slug: "p42", title: "P42" }]),
      )
      .mockResolvedValueOnce(mkResponse<FakeBlog>([mkBlog("c1"), mkBlog("c2")]));
    const out = await getRelatedBlogs(
      "1",
      ["cat-1"],
      [42 as unknown as Blog],
    );
    expect(out.map((b: Blog) => b.id)).toEqual(["42", "c1", "c2"]);
  });
});

describe("getAutoJourneyTargets", () => {
  const ANCHOR = "2026-05-01T00:00:00.000Z";

  test("no publishedAt → returns null/null without firing any fetch", async () => {
    const out = await getAutoJourneyTargets("self", undefined, ["cat-1"]);
    expect(fetchCMS).not.toHaveBeenCalled();
    expect(out).toEqual({ previous: null, next: null });
  });

  test("same category has both neighbors → uses them, no site-wide query", async () => {
    fetchCMS
      .mockResolvedValueOnce(mkResponse<FakeBlog>([mkBlog("prev-cat")]))
      .mockResolvedValueOnce(mkResponse<FakeBlog>([mkBlog("next-cat")]));
    const out = await getAutoJourneyTargets("self", ANCHOR, ["cat-1"]);
    expect(fetchCMS).toHaveBeenCalledTimes(2);
    expect(out.previous?.id).toBe("prev-cat");
    expect(out.next?.id).toBe("next-cat");
  });

  test("same category has previous but no next → site-wide fills next only", async () => {
    fetchCMS
      .mockResolvedValueOnce(mkResponse<FakeBlog>([mkBlog("prev-cat")]))
      .mockResolvedValueOnce(mkResponse<FakeBlog>([])) // no next in category
      .mockResolvedValueOnce(mkResponse<FakeBlog>([mkBlog("next-site")])); // site-wide next
    const out = await getAutoJourneyTargets("self", ANCHOR, ["cat-1"]);
    expect(fetchCMS).toHaveBeenCalledTimes(3);
    expect(out.previous?.id).toBe("prev-cat");
    expect(out.next?.id).toBe("next-site");
  });

  test("no categories → goes straight to site-wide chronological", async () => {
    fetchCMS
      .mockResolvedValueOnce(mkResponse<FakeBlog>([mkBlog("prev-site")]))
      .mockResolvedValueOnce(mkResponse<FakeBlog>([mkBlog("next-site")]));
    const out = await getAutoJourneyTargets("self", ANCHOR, []);
    expect(fetchCMS).toHaveBeenCalledTimes(2);
    expect(out.previous?.id).toBe("prev-site");
    expect(out.next?.id).toBe("next-site");
  });

  test("no neighbors anywhere → returns null/null", async () => {
    fetchCMS
      .mockResolvedValueOnce(mkResponse<FakeBlog>([]))
      .mockResolvedValueOnce(mkResponse<FakeBlog>([]))
      .mockResolvedValueOnce(mkResponse<FakeBlog>([]))
      .mockResolvedValueOnce(mkResponse<FakeBlog>([]));
    const out = await getAutoJourneyTargets("self", ANCHOR, ["cat-1"]);
    expect(out).toEqual({ previous: null, next: null });
  });
});

describe("isLexicalBodyEmpty", () => {
  test("null / undefined body is empty", () => {
    expect(isLexicalBodyEmpty(null)).toBe(true);
    expect(isLexicalBodyEmpty(undefined)).toBe(true);
  });

  test("no children is empty", () => {
    expect(isLexicalBodyEmpty(mkRoot([]))).toBe(true);
  });

  test("a single empty paragraph is empty", () => {
    expect(
      isLexicalBodyEmpty(mkRoot([{ type: "paragraph", version: 1, children: [] }])),
    ).toBe(true);
  });

  test("a paragraph with only whitespace text is empty", () => {
    expect(
      isLexicalBodyEmpty(
        mkRoot([
          { type: "paragraph", version: 1, children: [{ type: "text", version: 1, text: "   " }] },
        ]),
      ),
    ).toBe(true);
  });

  test("a paragraph with real text is not empty", () => {
    expect(
      isLexicalBodyEmpty(
        mkRoot([
          { type: "paragraph", version: 1, children: [{ type: "text", version: 1, text: "Hi" }] },
        ]),
      ),
    ).toBe(false);
  });

  test("a self-contained node (upload) with no children is not empty", () => {
    expect(isLexicalBodyEmpty(mkRoot([{ type: "upload", version: 1 }]))).toBe(false);
  });

  test("a heading with text is not empty", () => {
    expect(
      isLexicalBodyEmpty(
        mkRoot([
          { type: "heading", tag: "h2", version: 1, children: [{ type: "text", version: 1, text: "T" }] },
        ]),
      ),
    ).toBe(false);
  });
});
