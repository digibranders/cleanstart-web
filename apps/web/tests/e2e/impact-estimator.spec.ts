import { expect, test } from "@playwright/test";

/**
 * Impact Estimator: shareable-link state.
 *
 * The four inputs round-trip through the URL so a result can be forwarded by
 * link. A link-driven load must land on that exact state, and moving a control
 * must update the address bar without a navigation. Numbers come from the
 * client's ROI 1.xlsx bands: 400 images / 120 engineers / Weekly / Continuous
 * is every input at its top weight, which is the 360-point Extreme tier.
 *
 * @phase-web-impact-estimator
 */

const ROUTE = "/impact-estimator";

test.describe("impact estimator @phase-web-impact-estimator", () => {
  test("adopts the inputs from a shared link", async ({ page }) => {
    await page.goto(`${ROUTE}?images=400&team=120&remediation=Weekly&release=Continuous`);

    const gauge = page.locator('[data-section="ImpactSimulator"] svg[role="img"]');
    await expect(gauge).toHaveAttribute("aria-label", /Operational Burden Score 360 of 360, Runtime Complexity Extreme/);

    await expect(page.getByRole("slider", { name: "Production images" })).toHaveValue("400");
    await expect(page.getByRole("slider", { name: "Engineering team size" })).toHaveValue("120");
    await expect(page.getByRole("button", { name: "Weekly", pressed: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continuous", pressed: true })).toBeVisible();
  });

  test("mirrors a control change into the address bar", async ({ page }) => {
    await page.goto(ROUTE);
    await expect(page).toHaveURL(new RegExp(`${ROUTE}$`));

    await page.getByRole("button", { name: "Quarterly" }).click();

    await expect(page).toHaveURL(/\?images=200&team=40&remediation=Quarterly&release=Continuous$/);
    await expect(page.getByRole("button", { name: "Quarterly", pressed: true })).toBeVisible();
  });

  test("ignores an invalid shared link and falls back to the defaults", async ({ page }) => {
    await page.goto(`${ROUTE}?images=abc&team=99999&remediation=daily`);

    await expect(page.getByRole("slider", { name: "Production images" })).toHaveValue("200");
    await expect(page.getByRole("slider", { name: "Engineering team size" })).toHaveValue("200");
    await expect(page.getByRole("button", { name: "Monthly", pressed: true }).first()).toBeVisible();
  });
});

test.describe("impact estimator copy link @phase-web-impact-estimator", () => {
  test("copies a link that carries the current inputs", async ({ page, context, browserName }) => {
    test.skip(browserName !== "chromium", "clipboard permissions are only grantable in Chromium");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(`${ROUTE}?images=60&team=15&remediation=Quarterly&release=Monthly`);

    const button = page.getByRole("button", { name: "Copy link to results" });
    await button.click();
    await expect(page.getByRole("button", { name: "Link copied" })).toBeVisible();

    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toBe(`${new URL(page.url()).origin}${ROUTE}?images=60&team=15&remediation=Quarterly&release=Monthly`);
  });
});

test.describe("impact estimator mobile summary @phase-web-impact-estimator", () => {
  test("shows a live summary strip while the inputs are on screen and the results are not", async ({ page, viewport }) => {
    test.skip(!viewport || viewport.width >= 1024, "the strip only exists below the lg breakpoint");
    await page.goto(ROUTE);

    const strip = page.locator('button[aria-label^="Jump to your results"]');
    await expect(strip).toHaveAttribute("aria-hidden", "true");

    // Scroll so the gauge is only a fifth visible at the bottom edge: the inputs
    // card is on screen and the readout is not, on phones and tablets alike. A
    // fixed offset from the card top would not do: at 768px the card is short
    // enough that the gauge is already mostly visible, and the strip rightly
    // stays hidden.
    await page.evaluate(() => {
      const gauge = document.querySelector<HTMLElement>('[data-section="ImpactSimulator"] svg[role="img"]');
      if (!gauge) return;
      const r = gauge.getBoundingClientRect();
      window.scrollTo({ top: r.top + window.scrollY - window.innerHeight + r.height * 0.2, behavior: "instant" });
    });
    await expect(strip).toHaveAttribute("aria-hidden", "false");
    await expect(strip).toHaveAttribute("aria-label", /High runtime complexity, burden 260, 7,800 hours/);

    await strip.click();
    await expect(strip).toHaveAttribute("aria-hidden", "true");
    await expect(page.locator('[data-section="ImpactSimulator"] svg[role="img"]')).toBeInViewport();
  });
});

test.describe("impact estimator sticky inputs @phase-web-impact-estimator", () => {
  test("keeps the inputs card pinned beside the results while the column scrolls", async ({ page, viewport }) => {
    test.skip(!viewport || viewport.width < 1024, "inputs are only sticky from the lg breakpoint");
    await page.goto(ROUTE);

    const card = page.locator('[data-section="ImpactSimulator"] .lg\\:sticky');
    const results = page.locator('[data-section="ImpactSimulator"] .lg\\:sticky + div');

    // At rest both columns start on the same line.
    const rest = await page.evaluate(() => {
      const a = document.querySelector('[data-section="ImpactSimulator"] .lg\\:sticky');
      const b = a?.nextElementSibling;
      return a && b ? Math.round(a.getBoundingClientRect().top - b.getBoundingClientRect().top) : Number.NaN;
    });
    expect(rest).toBe(0);

    // Bring the section under the header, then scroll a further 150px: the card
    // pins at header + 24 while the results keep moving. 150px keeps the card
    // inside its grid row, which is only as tall as the results column.
    const headerH = await page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--cs-header-h")));
    await page.evaluate((h) => {
      const section = document.querySelector('[data-section="ImpactSimulator"]');
      if (section) window.scrollTo({ top: section.getBoundingClientRect().top + window.scrollY - h, behavior: "instant" });
    }, headerH);
    const before = await results.evaluate((el) => el.getBoundingClientRect().top);
    await page.evaluate(() => window.scrollBy({ top: 150, behavior: "instant" }));
    const cardTop = await card.evaluate((el) => el.getBoundingClientRect().top);
    const after = await results.evaluate((el) => el.getBoundingClientRect().top);

    expect(Math.round(cardTop)).toBe(Math.round(headerH + 24));
    expect(Math.round(before - after)).toBe(150);
  });
});
