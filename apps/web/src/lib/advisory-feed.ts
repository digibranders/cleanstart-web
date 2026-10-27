import { advisoryHeading, advisoryStatusLabel, cvssRating, type AdvisoryRow } from "./advisory-utils";
import { effectivePublishedAt } from "./published-date";

export const ADVISORY_FEED_PATH = "/advisories/feed.xml";
export const ADVISORY_FEED_TITLE = "CleanStart Security Advisories";

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

/** RFC 822 date, the format RSS 2.0 requires. */
const rfc822 = (iso: string): string => new Date(iso).toUTCString();

/** RSS 2.0 feed of published advisories, newest first as given. */
export function buildAdvisoryFeed(advisories: AdvisoryRow[], siteUrl: string): string {
  const listingUrl = `${siteUrl}/advisories`;
  const items = advisories.map((a) => {
    const url = `${listingUrl}/${a.slug}`;
    const publishedAt = effectivePublishedAt(a);
    const summary = [
      a.abstract?.trim(),
      `CVSS ${a.cvssScore.toFixed(1)} ${cvssRating(a.cvssScore)}.`,
      `Status: ${advisoryStatusLabel(a.fixStatus)}.`,
    ]
      .filter(Boolean)
      .join(" ");
    return [
      "<item>",
      `<title>${escapeXml(advisoryHeading(a))}</title>`,
      `<link>${escapeXml(url)}</link>`,
      `<guid isPermaLink="true">${escapeXml(url)}</guid>`,
      publishedAt ? `<pubDate>${rfc822(publishedAt)}</pubDate>` : "",
      a.technology ? `<category>${escapeXml(a.technology.trim())}</category>` : "",
      `<description>${escapeXml(summary)}</description>`,
      "</item>",
    ]
      .filter(Boolean)
      .join("");
  });
  const newest = advisories[0] ? effectivePublishedAt(advisories[0]) : undefined;

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "<channel>",
    `<title>${ADVISORY_FEED_TITLE}</title>`,
    `<link>${escapeXml(listingUrl)}</link>`,
    "<description>Security advisories from CleanStart: affected versions, CVSS scores and fixes for vulnerabilities in open source runtimes and container images.</description>",
    "<language>en-us</language>",
    newest ? `<lastBuildDate>${rfc822(newest)}</lastBuildDate>` : "",
    `<atom:link href="${escapeXml(`${siteUrl}${ADVISORY_FEED_PATH}`)}" rel="self" type="application/rss+xml"/>`,
    ...items,
    "</channel>",
    "</rss>",
  ]
    .filter(Boolean)
    .join("\n");
}
