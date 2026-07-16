import { expect, test } from "@playwright/test";

/**
 * @phase-j-consent — cookie-consent CMP acceptance suite (WEB-PRODUCTION.md §11).
 *
 * Verifies: banner shows on first visit with one-click Allow/Reject parity,
 * no analytics IDENTIFIER is stored before consent (Advanced Consent Mode v2 —
 * gtag.js may send cookieless modeling pings pre-consent, but sets no `_ga`
 * cookie until Analytics is granted), the 4-category preference panel persists
 * per-category choices to the `cs_consent` cookie, and the footer affordance
 * re-opens the banner (GDPR Art. 7(3) withdrawal parity).
 */
test.describe("cookie consent", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("banner shows on first visit and stores no analytics identifier before consent", async ({
    page,
  }) => {
    await page.goto("/");
    const banner = page.getByRole("dialog", { name: "Cookie consent" });
    await expect(banner).toBeVisible();
    await expect(page.getByRole("button", { name: "Allow All" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reject All" })).toBeVisible();

    // Advanced Consent Mode contract: default-denied `analytics_storage` means
    // gtag.js writes NO `_ga`/`_gid` identifier to the device before consent,
    // even though the (cookieless) tag itself may have loaded.
    const gaCookies = (await page.context().cookies()).filter((c) =>
      c.name.startsWith("_ga"),
    );
    expect(gaCookies).toHaveLength(0);
  });

  test("Reject All has one-click parity and dismisses the banner", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Reject All" }).click();
    await expect(
      page.getByRole("dialog", { name: "Cookie consent" }),
    ).toBeHidden();
    const cookie = (await page.context().cookies()).find(
      (c) => c.name === "cs_consent",
    );
    const value = decodeURIComponent(cookie?.value ?? "");
    expect(value).toContain("reject_all");
    expect(value).toContain('"performance":false');
    expect(value).toContain('"targeting":false');
  });

  test("Allow All grants every category in the cookie", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Allow All" }).click();
    const cookie = (await page.context().cookies()).find(
      (c) => c.name === "cs_consent",
    );
    const value = decodeURIComponent(cookie?.value ?? "");
    expect(value).toContain("accept_all");
    expect(value).toContain('"performance":true');
    expect(value).toContain('"functional":true');
    expect(value).toContain('"targeting":true');
  });

  test("Cookies Settings → Confirm My Choices persists per-category selection", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Cookies Settings" }).click();
    // Toggles default ON; switch Targeting off, then confirm.
    await page.getByRole("switch", { name: "Toggle Targeting Cookies" }).click();
    await page.getByRole("button", { name: "Confirm My Choices" }).click();
    const cookie = (await page.context().cookies()).find(
      (c) => c.name === "cs_consent",
    );
    const value = decodeURIComponent(cookie?.value ?? "");
    expect(value).toContain("custom");
    expect(value).toContain('"performance":true');
    expect(value).toContain('"targeting":false');
  });

  test("footer Cookie preferences re-opens the banner", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Allow All" }).click();
    await expect(
      page.getByRole("dialog", { name: "Cookie consent" }),
    ).toBeHidden();
    await page.getByRole("button", { name: "Cookie preferences" }).click();
    await expect(
      page.getByRole("dialog", { name: "Cookie consent" }),
    ).toBeVisible();
  });
});
