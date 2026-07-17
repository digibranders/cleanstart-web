import { describe, expect, it } from "vitest";
import { breadcrumbTrail } from "./breadcrumbs";

describe("breadcrumbTrail", () => {
  it("blog: Home > Blogs > Title, current crumb has no path", () => {
    expect(breadcrumbTrail("blog", { title: "My Post" })).toEqual([
      { name: "Home", path: "/" },
      { name: "Blogs", path: "/blogs" },
      { name: "My Post" },
    ]);
  });

  it("news uses the 'Newsroom' label and /news path", () => {
    const t = breadcrumbTrail("news", { title: "Press" });
    expect(t[1]).toEqual({ name: "Newsroom", path: "/news" });
  });

  it("job lives under Careers", () => {
    expect(breadcrumbTrail("job", { title: "Engineer" })[1]).toEqual({
      name: "Careers",
      path: "/careers",
    });
  });

  it("resource uses the real 'Resource Center' label", () => {
    expect(breadcrumbTrail("resource", { title: "eBook" })[1]).toEqual({
      name: "Resource Center",
      path: "/resource-center",
    });
  });

  it("author has no /author parent (no such route): Home > Name", () => {
    expect(breadcrumbTrail("author", { title: "Jane Doe" })).toEqual([
      { name: "Home", path: "/" },
      { name: "Jane Doe" },
    ]);
  });

  it("knowledgeBase: Home > Knowledge Hub > Title, no category crumb (categories have no page)", () => {
    expect(breadcrumbTrail("knowledgeBase", { title: "Article" })).toEqual([
      { name: "Home", path: "/" },
      { name: "Knowledge Hub", path: "/knowledge-hub" },
      { name: "Article" },
    ]);
  });

  it("guide uses the '/guide' path (not '/guides')", () => {
    expect(breadcrumbTrail("guide", { title: "Article" })[1]).toEqual({
      name: "Guides",
      path: "/guide",
    });
  });

  it("event uses the '/events' listing path (not '/event')", () => {
    expect(breadcrumbTrail("event", { title: "Conf" })[1]).toEqual({
      name: "Events",
      path: "/events",
    });
  });

  it("legal uses 'Legal' and /legal path", () => {
    expect(breadcrumbTrail("legal", { title: "DPA" })[1]).toEqual({
      name: "Legal",
      path: "/legal",
    });
  });

  it("webinar uses the '/webinars' listing path", () => {
    expect(breadcrumbTrail("webinar", { title: "W" })[1]).toEqual({
      name: "Webinars",
      path: "/webinars",
    });
  });

  // Every kind (knowledgeBase included) now shares the same shape: the ONLY crumb
  // without a path is the last one. This is the invariant that keeps the JSON-LD
  // BreadcrumbList valid — no mid-trail ListItem is ever missing its `item` URL.
  it("contract: first crumb is Home, last crumb is the title with no path, all others linked", () => {
    const kinds = ["blog", "guide", "news", "event", "job", "resource", "author", "legal", "knowledgeBase", "webinar"] as const;
    for (const kind of kinds) {
      const trail = breadcrumbTrail(kind, { title: "X" });
      expect(trail[0]).toEqual({ name: "Home", path: "/" });
      expect(trail.at(-1)).toEqual({ name: "X" });
      for (const c of trail.slice(0, -1)) {
        expect(typeof c.path).toBe("string");
      }
    }
  });

  it("contract: no trail links to a route that does not exist", () => {
    const dead = ["/author", "/resources", "/webinar", "/jobs"];
    const kinds = ["blog", "guide", "news", "event", "job", "resource", "author", "legal", "knowledgeBase", "webinar"] as const;
    for (const kind of kinds) {
      for (const crumb of breadcrumbTrail(kind, { title: "X" })) {
        if (crumb.path) expect(dead).not.toContain(crumb.path);
      }
    }
  });
});
