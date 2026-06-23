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

  it("knowledgeBase inserts an unlinked category between hub and title", () => {
    expect(breadcrumbTrail("knowledgeBase", { title: "Article", category: "Images" })).toEqual([
      { name: "Home", path: "/" },
      { name: "Knowledge Hub", path: "/knowledge-hub" },
      { name: "Images" },
      { name: "Article" },
    ]);
  });

  it("knowledgeBase omits the category crumb when absent", () => {
    expect(breadcrumbTrail("knowledgeBase", { title: "Article" })).toEqual([
      { name: "Home", path: "/" },
      { name: "Knowledge Hub", path: "/knowledge-hub" },
      { name: "Article" },
    ]);
  });

  it("contract: first crumb is Home, last crumb is the title with no path", () => {
    const kinds = ["blog", "guide", "news", "event", "job", "resource", "author", "legal"] as const;
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
    const kinds = ["blog", "guide", "news", "event", "job", "resource", "author", "legal", "knowledgeBase"] as const;
    for (const kind of kinds) {
      for (const crumb of breadcrumbTrail(kind, { title: "X", category: "C" })) {
        if (crumb.path) expect(dead).not.toContain(crumb.path);
      }
    }
  });
});
