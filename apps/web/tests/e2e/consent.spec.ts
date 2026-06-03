import { expect, test } from "@playwright/test";

/**
 * @phase-j-consent — cookie-consent CMP acceptance suite (WEB-PRODUCTION.md §11).
 *
 * Verifies: banner shows on first visit with one-click Accept/Reject parity,
 * no behavioural analytics fires before consent, decisions persist to the
 * `cs_consent` cookie, and the footer affordance re-opens the banner
 * (GDPR Art. 7(3) withdrawal parity).
 */
test.describe("cookie consent", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("banner shows on first visit and fires no analytics before consent", async ({
    page,
  }) => {
    const analyticsHits: string[] = [];
    page.on("request", (r) => {
      const u = r.url();
      if (
        u.includes("google-analytics.com") ||
        u.includes("/_vercel/insights") ||
        u.includes("/_vercel/speed-insights")
      ) {
        analyticsHits.push(u);
      }
    });
    await page.goto("/");
    const banner = page.getByRole("dialog", { name: "Cookie consent" });
    await expect(banner).toBeVisible();
    await expect(page.getByRole("button", { name: "Accept all" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reject all" })).toBeVisible();
    expect(analyticsHits).toHaveLength(0);
  });

  test("Reject all has one-click parity and dismisses the banner", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Reject all" }).click();
    await expect(
      page.getByRole("dialog", { name: "Cookie consent" }),
    ).toBeHidden();
    const cookie = (await page.context().cookies()).find(
      (c) => c.name === "cs_consent",
    );
    expect(cookie?.value).toContain("reject_all");
  });

  test("Accept all sets analytics granted in the cookie", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Accept all" }).click();
    const cookie = (await page.context().cookies()).find(
      (c) => c.name === "cs_consent",
    );
    expect(cookie?.value).toContain("accept_all");
    expect(decodeURIComponent(cookie?.value ?? "")).toContain(
      '"analytics":true',
    );
  });

  test("footer Cookie preferences re-opens the banner", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Accept all" }).click();
    await expect(
      page.getByRole("dialog", { name: "Cookie consent" }),
    ).toBeHidden();
    await page.getByRole("button", { name: "Cookie preferences" }).click();
    await expect(
      page.getByRole("dialog", { name: "Cookie consent" }),
    ).toBeVisible();
  });
});
