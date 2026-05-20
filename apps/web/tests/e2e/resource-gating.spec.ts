import { expect, test } from "@playwright/test";

/**
 * Resource gating regression test (v3 plan Sprint 1 Day 5).
 *
 * Validates that the `gateForm` path on /resource/[slug] cannot bypass
 * the lead-capture form. The audit's v3 first pass claimed the Hero CTA
 * streamed the asset regardless of gateForm; v3.1 re-verification (and
 * this test) prove the path is correctly wired via ResourceDownloadButton.
 *
 * Contract under test:
 *   When `resource.gated === true` AND `gateForm != null`, the Download
 *   CTA must render as a <button> (not an <a download>). Clicking it
 *   must call /api/resources/{slug}/token; on 403/404 the gate modal
 *   must open with the form fields visible.
 *
 * Requires a real gated resource slug visible to the running server. Set
 *   E2E_GATED_RESOURCE_SLUG=<slug>
 * to enable; otherwise the spec is skipped (Sprint 1 has no CMS fixture
 * scaffold; this test becomes mandatory once one exists).
 */

const slug = process.env.E2E_GATED_RESOURCE_SLUG;

test.describe("resource gating", () => {
  test.skip(!slug, "set E2E_GATED_RESOURCE_SLUG to a slug of a gated resource");

  test("Hero Download CTA opens the gate modal instead of streaming the asset", async ({ page }) => {
    // Force the token check to fail so the modal path is exercised. Use a
    // wildcard pattern that matches both same-origin and CMS-origin token URLs.
    await page.route(/\/api\/resources\/[^/]+\/token(?:\?.*)?$/i, async (route) => {
      await route.fulfill({ status: 403, body: JSON.stringify({ ok: false }) });
    });

    // Sentinel: any actual asset GET should be flagged.
    let assetFetched = false;
    page.on("request", (req) => {
      const url = req.url();
      if (/\.(pdf|zip|docx?|xlsx?|csv|txt|tar(?:\.gz)?|whl)(?:\?|$)/i.test(url)) {
        assetFetched = true;
      }
    });

    await page.goto(`/resource/${slug}`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});

    // The Download CTA on a gated resource must be a <button>, not an <a>.
    // We locate by visible label.
    const downloadCta = page.getByRole("button", { name: /download/i }).first();
    await expect(downloadCta, "Hero Download CTA must render as a button when gated").toBeVisible();

    await downloadCta.click();

    // Asset must NOT have been fetched.
    expect(assetFetched, "Gated resource asset was fetched without form submit").toBe(false);

    // The gate modal must appear with the form fields visible.
    const modalHeading = page.getByRole("heading", { name: /(unlock|download|access)/i }).first();
    await expect(modalHeading).toBeVisible({ timeout: 5_000 });
    await expect(page.locator("form input").first()).toBeVisible({ timeout: 5_000 });
  });
});
