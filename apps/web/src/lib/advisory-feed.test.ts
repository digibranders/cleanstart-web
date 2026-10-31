import { describe, expect, it } from "vitest";

import { buildAdvisoryFeed } from "./advisory-feed";
import type { AdvisoryRow } from "./advisory-utils";

const node: AdvisoryRow = {
  id: "2",
  title: "Node.js Brotli decoder out-of-bounds write",
  slug: "cve-2026-111497-nodejs-brotli",
  technology: "Node.js",
  cves: ["CVE-2026-111497"],
  cvssScore: 9.2,
  fixStatus: "fixed",
  abstract: "A crafted Brotli stream <script> & friends.",
  publishedAt: "2026-10-26T00:00:00.000Z",
  displayPublishedAt: "2026-10-26T00:00:00.000Z",
};

describe("buildAdvisoryFeed", () => {
  const xml = buildAdvisoryFeed([node], "https://www.cleanstart.com");

  it("is an RSS 2.0 channel that points at itself", () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">');
    expect(xml).toContain(
      '<atom:link href="https://www.cleanstart.com/advisories/feed.xml" rel="self" type="application/rss+xml"/>',
    );
  });

  it("titles each item with its CVE IDs and links to the advisory", () => {
    expect(xml).toContain("<title>CVE-2026-111497: Node.js Brotli decoder out-of-bounds write</title>");
    expect(xml).toContain(
      "<link>https://www.cleanstart.com/advisories/cve-2026-111497-nodejs-brotli</link>",
    );
    expect(xml).toContain(
      '<guid isPermaLink="true">https://www.cleanstart.com/advisories/cve-2026-111497-nodejs-brotli</guid>',
    );
    expect(xml).toContain("<category>Node.js</category>");
  });

  it("dates items and the channel in RFC 822", () => {
    expect(xml).toContain("<pubDate>Mon, 26 Oct 2026 00:00:00 GMT</pubDate>");
    expect(xml).toContain("<lastBuildDate>Mon, 26 Oct 2026 00:00:00 GMT</lastBuildDate>");
  });

  it("escapes markup in text and adds the CVSS rating and status", () => {
    expect(xml).toContain(
      "<description>A crafted Brotli stream &lt;script&gt; &amp; friends. CVSS 9.2 Critical. Status: Fixed.</description>",
    );
  });

  it("stays valid with no advisories", () => {
    const empty = buildAdvisoryFeed([], "https://www.cleanstart.com");
    expect(empty).toContain("<channel>");
    expect(empty).not.toContain("<item>");
    expect(empty).not.toContain("<lastBuildDate>");
  });
});
