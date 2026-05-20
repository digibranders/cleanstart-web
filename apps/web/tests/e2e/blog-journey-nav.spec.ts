import { expect, test } from "@playwright/test";

/**
 * Blog Detail — JourneyNav + curated relatedPosts e2e (@phase-blog-journey).
 *
 * Validates three ships:
 *
 *   1. Editorial `previousPost` / `nextPost` render below the author card
 *      with the right labels, hrefs, and SEO link tags.
 *   2. Auto chronological fallback when either field is unset — the section
 *      still renders with neighbors from the same category (or site-wide).
 *   3. Curated `relatedPosts` appear first in the Related Blogs grid, before
 *      any category / site-wide auto-fill.
 *
 * Like `resource-gating.spec.ts`, the harder cases are env-gated so they
 * can be skipped on machines with an empty dev DB. The auto-fallback case
 * is the easiest to verify — any published blog detail page with at least
 * one chronologically-adjacent sibling will surface a JourneyNav.
 *
 *   E2E_BLOG_JOURNEY_SLUG=<slug-with-prev-AND-next-set>
 *   E2E_BLOG_NO_JOURNEY_SLUG=<slug-with-no-siblings-of-any-kind>
 *   E2E_BLOG_AUTO_JOURNEY_SLUG=<published-slug-with-no-manual-fields-but-chrono-siblings>
 *   E2E_BLOG_RELATED_SLUG=<slug-with-curated-relatedPosts>
 *   E2E_BLOG_RELATED_FIRST_SLUG=<expected-first-curated-slug>
 */

const journeySlug = process.env.E2E_BLOG_JOURNEY_SLUG;
const autoJourneySlug = process.env.E2E_BLOG_AUTO_JOURNEY_SLUG;
const noJourneySlug = process.env.E2E_BLOG_NO_JOURNEY_SLUG;
const relatedSlug = process.env.E2E_BLOG_RELATED_SLUG;

test.describe("blog journey nav @phase-blog-journey", () => {
  test.skip(
    !journeySlug,
    "set E2E_BLOG_JOURNEY_SLUG to a blog slug that has previousPost AND nextPost set",
  );

  test("renders Previous / Next cells with hrefs and emits rel=prev / rel=next", async ({
    page,
  }) => {
    await page.goto(`/blog/${journeySlug}`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});

    const section = page.locator('[data-section="BlogDetailJourneyNav"]');
    await expect(section).toBeVisible();

    const prevLink = section.getByRole("link", { name: /Previous Article:/i });
    const nextLink = section.getByRole("link", { name: /Next Article:/i });
    await expect(prevLink).toBeVisible();
    await expect(nextLink).toBeVisible();

    await expect(prevLink).toHaveAttribute("rel", "prev");
    await expect(nextLink).toHaveAttribute("rel", "next");
    await expect(prevLink).toHaveAttribute("href", /^\/blog\/[^\s/]+$/);
    await expect(nextLink).toHaveAttribute("href", /^\/blog\/[^\s/]+$/);

    const headPrev = page.locator('head link[rel="prev"]');
    const headNext = page.locator('head link[rel="next"]');
    await expect(headPrev).toHaveCount(1);
    await expect(headNext).toHaveCount(1);
    await expect(headPrev).toHaveAttribute("href", /\/blog\/[^\s/]+$/);
    await expect(headNext).toHaveAttribute("href", /\/blog\/[^\s/]+$/);
  });
});

test.describe("blog journey auto fallback @phase-blog-journey", () => {
  test.skip(
    !autoJourneySlug,
    "set E2E_BLOG_AUTO_JOURNEY_SLUG to a published slug whose previousPost/nextPost are unset but that has chronological siblings",
  );

  test("auto-fills JourneyNav when the editor did not set previous/next", async ({
    page,
  }) => {
    await page.goto(`/blog/${autoJourneySlug}`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});

    const section = page.locator('[data-section="BlogDetailJourneyNav"]');
    await expect(section).toBeVisible();

    // At least one direction must be filled by the auto fallback.
    const totalCells = await section.locator("a[rel='prev'], a[rel='next']").count();
    expect(totalCells).toBeGreaterThanOrEqual(1);

    // Whatever side is filled, the corresponding head link must be hoisted.
    const heads = page.locator('head link[rel="prev"], head link[rel="next"]');
    await expect.poll(async () => heads.count()).toBeGreaterThanOrEqual(1);
  });
});

test.describe("blog journey absent @phase-blog-journey", () => {
  test.skip(
    !noJourneySlug,
    "set E2E_BLOG_NO_JOURNEY_SLUG to a slug where there are NO chronological siblings (e.g. an only-post)",
  );

  test("section absent + no rel links when there is nothing to point at", async ({
    page,
  }) => {
    await page.goto(`/blog/${noJourneySlug}`, { waitUntil: "domcontentloaded" });
    await expect(
      page.locator('[data-section="BlogDetailJourneyNav"]'),
    ).toHaveCount(0);
    await expect(page.locator('head link[rel="prev"]')).toHaveCount(0);
    await expect(page.locator('head link[rel="next"]')).toHaveCount(0);
  });
});

test.describe("blog related posts curation @phase-blog-journey", () => {
  test.skip(
    !relatedSlug,
    "set E2E_BLOG_RELATED_SLUG to a blog slug with curated relatedPosts (at least one pin)",
  );

  test("curated relatedPosts appear first in the Related Blogs grid", async ({
    page,
  }) => {
    const expectedFirstSlug = process.env.E2E_BLOG_RELATED_FIRST_SLUG;
    await page.goto(`/blog/${relatedSlug}`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});

    const grid = page.locator('[data-section="BlogDetailRelatedPosts"]');
    await expect(grid).toBeVisible();

    const firstCardLink = grid.locator('a[href^="/blog/"]').first();
    await expect(firstCardLink).toBeVisible();

    if (expectedFirstSlug) {
      await expect(firstCardLink).toHaveAttribute(
        "href",
        new RegExp(`/blog/${expectedFirstSlug}(?:[?#].*)?$`),
      );
    }
  });
});
