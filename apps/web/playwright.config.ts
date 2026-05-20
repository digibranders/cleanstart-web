import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for the v3 responsive-remediation gate.
 *
 * Six viewport projects (375 / 768 / 1024 / 1280 / 1440 / 1920) run the same
 * smoke spec against the dev server. The spec asserts no horizontal scroll
 * (informational in Sprint 1 — fails are recorded as the baseline, not the
 * build), runs axe-core (fails on serious/critical), and captures a
 * screenshot baseline.
 *
 * Plan reference: ~/.claude/plans/lovely-honking-milner.md Sprint 1 Day 2.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // 1 worker per project when recording baselines so afterAll sees every route
  // in the project (otherwise each worker overwrites the project's baseline file
  // with only the subset of routes it executed).
  workers: process.env.UPDATE_E2E_BASELINE === "1" ? 1 : process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [["list"], ["github"], ["json", { outputFile: "playwright-report/results.json" }]]
    : [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3001",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    headless: true,
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "mobile-375",
      use: { ...devices["Desktop Chrome"], viewport: { width: 375, height: 812 }, deviceScaleFactor: 1 },
    },
    {
      name: "tablet-768",
      use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 }, deviceScaleFactor: 1 },
    },
    {
      name: "laptop-1024",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 },
    },
    {
      name: "desktop-1280",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 },
    },
    {
      name: "desktop-1440",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
    },
    {
      name: "desktop-1920",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "pnpm dev",
        url: "http://127.0.0.1:3001",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        stdout: "ignore",
        stderr: "pipe",
      },
});
