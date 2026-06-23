import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Architecture fitness test: every detail hero (visible breadcrumb) and detail
// page (JSON-LD) MUST derive its breadcrumb from the shared breadcrumbTrail
// builder — never an inline array. Inline trails are how the visible bar and the
// JSON-LD silently drifted (fake "Resources" crumb, /author 404, etc.). A
// re-introduced inline trail hardcodes the leading "Home" crumb, so we assert
// (a) the file calls breadcrumbTrail( and (b) it has no hardcoded Home crumb.
const rel = (p: string): string => fileURLToPath(new URL(p, import.meta.url));

const HEROES = [
  "../../components/sections/news-detail/NewsDetailHero.tsx",
  "../../components/sections/blog/BlogDetailHero.tsx",
  "../../components/sections/guide/GuideDetailHero.tsx",
  "../../components/sections/events/EventDetailHero.tsx",
  "../../components/sections/careers/CareerDetailHero.tsx",
  "../../components/sections/resource/ResourceDetailHero.tsx",
];

const PAGES = [
  "../../app/blogs/[slug]/page.tsx",
  "../../app/guide/[slug]/page.tsx",
  "../../app/news/[slug]/page.tsx",
  "../../app/event/[slug]/page.tsx",
  "../../app/job/[slug]/page.tsx",
  "../../app/resources/[slug]/page.tsx",
  "../../app/author/[slug]/page.tsx",
  "../../app/(legal)/legal/[slug]/page.tsx",
  "../../app/knowledge-hub/[slug]/page.tsx",
];

const HOME_CRUMB = /(?:label|name):\s*["']Home["']/;

describe("breadcrumb single-source guard (web)", () => {
  it.each(HEROES)("hero %s uses breadcrumbTrail, no inline crumb array", (p) => {
    const src = readFileSync(rel(p), "utf8");
    expect(src, `${p} must call breadcrumbTrail(`).toContain("breadcrumbTrail(");
    expect(src, `${p} must not hardcode a Home crumb`).not.toMatch(HOME_CRUMB);
  });

  it.each(PAGES)("page %s feeds breadcrumbSchema from breadcrumbTrail", (p) => {
    const src = readFileSync(rel(p), "utf8");
    expect(src, `${p} must call breadcrumbTrail(`).toContain("breadcrumbTrail(");
    expect(src, `${p} must not hardcode a Home crumb`).not.toMatch(HOME_CRUMB);
  });
});
