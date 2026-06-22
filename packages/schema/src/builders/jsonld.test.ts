import { describe, expect, it } from "vitest";
import {
  blogPostingSchema,
  breadcrumbSchema,
  eventSchema,
  jobPostingSchema,
  organizationSchema,
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

  it("jobPostingSchema requires title + description + hiringOrganization", () => {
    const job = jobPostingSchema({ title: "Eng", description: "do things", path: "/job/eng" });
    expect(job.title).toBe("Eng");
    expect(job.description).toBe("do things");
    expect((job.hiringOrganization as { "@id": string })["@id"]).toBe(`${BASE}/#organization`);
  });
});
