import { describe, expect, it } from "vitest";
import {
  blogPostingSchema,
  breadcrumbSchema,
  eventSchema,
  jobPostingSchema,
  organizationSchema,
  videoObjectSchema,
} from "./jsonld";

// Builders read SITE_URL from NEXT_PUBLIC_SITE_URL with a fixed fallback.
// Tests assert against that fallback (env unset in the test runner), which
// also documents the byte-identical output preserved by the package move.
const BASE = "https://www.cleanstart.com";

describe("jsonld builders (INV-3 output guard)", () => {
  it("organizationSchema pins the canonical entity + verified profiles", () => {
    const org = organizationSchema();
    expect(org["@id"]).toBe(`${BASE}/#organization`);
    expect(org.name).toBe("CleanStart");
    expect(org.sameAs).toContain("https://github.com/cleanstart-dev");
  });

  it("breadcrumbSchema numbers crumbs and absolutises item URLs", () => {
    const bc = breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Blogs" }]);
    expect(bc.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Home", item: `${BASE}/` },
      { "@type": "ListItem", position: 2, name: "Blogs" },
    ]);
  });

  it("blogPostingSchema references the Organization by @id and links authors", () => {
    const post = blogPostingSchema({
      title: "T",
      path: "/blogs/t",
      authors: [{ name: "A", slug: "a" }],
    });
    expect(post.publisher).toEqual({ "@id": `${BASE}/#organization` });
    expect(post.author).toEqual([{ "@type": "Person", name: "A", url: `${BASE}/author/a` }]);
  });

  it("eventSchema maps status to the schema.org IRI", () => {
    const ev = eventSchema({ title: "E", path: "/event/e", venue: "V", eventStatus: "cancelled" });
    expect(ev.eventStatus).toBe("https://schema.org/EventCancelled");
    expect(ev.eventAttendanceMode).toBe("https://schema.org/OfflineEventAttendanceMode");
  });

  it("videoObjectSchema resolves embedPath against our origin", () => {
    const v = videoObjectSchema({
      name: "Lesson",
      contentUrl: "https://storage.googleapis.com/x.mp4",
      embedPath: "/knowledge-hub/a",
    });
    expect(v.embedUrl).toBe(`${BASE}/knowledge-hub/a`);
    expect("duration" in v).toBe(false);
  });

  it("videoObjectSchema prefers an absolute embedUrl over embedPath and carries duration", () => {
    const v = videoObjectSchema({
      name: "Clean Libraries",
      contentUrl: "https://www.youtube.com/watch?v=abc",
      embedUrl: "https://www.youtube-nocookie.com/embed/abc",
      embedPath: "/clean-libraries",
      duration: "PT2M39S",
      uploadDate: "2026-07-24T02:56:59-07:00",
      thumbnailUrl: `${BASE}/images/x.jpg`,
    });
    expect(v.embedUrl).toBe("https://www.youtube-nocookie.com/embed/abc");
    expect(v.duration).toBe("PT2M39S");
    expect(v.publisher).toEqual({ "@id": `${BASE}/#organization` });
  });

  it("jobPostingSchema requires title + description + hiringOrganization", () => {
    const job = jobPostingSchema({ title: "Eng", description: "do things", path: "/job/eng" });
    expect(job.title).toBe("Eng");
    expect(job.description).toBe("do things");
    expect((job.hiringOrganization as { "@id": string })["@id"]).toBe(`${BASE}/#organization`);
  });
});
