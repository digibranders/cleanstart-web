import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * v3 responsive-remediation smoke gate (ratchet semantics).
 *
 * For each of the top-10 routes at each of the 6 viewport projects:
 *
 *  1. Navigate, wait for load.
 *
 *  2. Capture the horizontal-scroll delta: `scrollWidth - clientWidth`.
 *     Written to `tests/e2e/__baselines__/h-scroll-<project>.json`. In Sprint 1
 *     this is informational; from Sprint 2 onward the build fails when a route
 *     that previously had delta === 0 regresses to delta > 0.
 *
 *  3. Run axe-core. Violation IDs ("serious"/"critical" only) are compared
 *     against the committed baseline at
 *     `tests/e2e/__baselines__/axe-<project>.json`. The build fails if any
 *     route now reports a violation ID that is NOT in its baseline list.
 *     Existing baseline violations are recorded as the work the remediation
 *     plan owes; they do not block CI.
 *
 *  4. To accept the current state as a new baseline (after a remediation
 *     sprint lands), run with `UPDATE_E2E_BASELINE=1`. The test rewrites the
 *     baseline files with whatever the current run produced and always passes.
 *
 * Plan reference: ~/.claude/plans/lovely-honking-milner.md Sprint 1 Day 2.
 */

const ROUTES = [
  "/",
  "/about-us",
  "/cleansight",
  "/cleanstart-images",
  "/vulnerability-remediation",
  "/fips",
  "/attack-surface-reduction",
  "/blogs",
  "/news",
  "/resource-center",
  "/for-ciso",
  "/software-composition-analysis",
  "/teams",
] as const;

const baselineDir = join(process.cwd(), "tests", "e2e", "__baselines__");
const updateBaseline = process.env.UPDATE_E2E_BASELINE === "1";

type HScrollEntry = { route: string; scrollWidth: number; clientWidth: number; delta: number };
type AxeEntry = { route: string; violations: { id: string; impact: string; help: string; nodes: number }[] };

// Per-project collectors. afterAll writes them out.
const hScrollByProject: Record<string, HScrollEntry[]> = {};
const axeByProject: Record<string, AxeEntry[]> = {};

function readBaseline<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as T;
  } catch {
    return null;
  }
}

test.afterAll(async ({}, testInfo) => {
  const project = testInfo.project.name;
  await mkdir(baselineDir, { recursive: true });

  const hScroll = hScrollByProject[project] ?? [];
  const axe = axeByProject[project] ?? [];

  const hScrollPath = join(baselineDir, `h-scroll-${project}.json`);
  const axePath = join(baselineDir, `axe-${project}.json`);

  // h-scroll baseline is rewritten only under UPDATE_E2E_BASELINE=1 (same as
  // axe). Normal CI runs measure but do not overwrite — they leave the
  // committed baseline intact so we can diff against it.
  if (updateBaseline && hScroll.length > 0) {
    hScroll.sort((a, b) => a.route.localeCompare(b.route));
    await writeFile(hScrollPath, `${JSON.stringify(hScroll, null, 2)}\n`);
  }

  // axe baseline is rewritten only when UPDATE_E2E_BASELINE=1.
  if (updateBaseline && axe.length > 0) {
    axe.sort((a, b) => a.route.localeCompare(b.route));
    // Persist only IDs (impact + help kept for human review); node count is
    // volatile so we drop it from the canonical baseline.
    const canonical = axe.map((e) => ({
      route: e.route,
      violationIds: [...new Set(e.violations.map((v) => v.id))].sort(),
    }));
    await writeFile(axePath, `${JSON.stringify(canonical, null, 2)}\n`);
  }
});

for (const route of ROUTES) {
  test(`smoke ${route}`, async ({ page }, testInfo) => {
    const project = testInfo.project.name;

    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response, `route ${route} returned no response`).not.toBeNull();
    expect(response?.status(), `route ${route} returned ${response?.status()}`).toBeLessThan(400);

    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});

    // (1) horizontal-scroll capture
    const dims = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    (hScrollByProject[project] ??= []).push({
      route,
      scrollWidth: dims.scrollWidth,
      clientWidth: dims.clientWidth,
      delta: dims.scrollWidth - dims.clientWidth,
    });

    // (2) axe-core scan
    const result = await new AxeBuilder({ page }).options({ resultTypes: ["violations"] }).analyze();
    const blocking = result.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    (axeByProject[project] ??= []).push({
      route,
      violations: blocking.map((v) => ({ id: v.id, impact: v.impact ?? "", help: v.help, nodes: v.nodes.length })),
    });

    if (updateBaseline) return; // baseline-recording mode never fails

    // (3) ratchet: only fail when a violation appears that the baseline doesn't list
    const baselinePath = join(baselineDir, `axe-${project}.json`);
    const baseline = readBaseline<{ route: string; violationIds: string[] }[]>(baselinePath);
    const known = new Set(baseline?.find((b) => b.route === route)?.violationIds ?? []);
    const newIds = blocking.map((v) => v.id).filter((id) => !known.has(id));

    if (newIds.length > 0) {
      const unique = [...new Set(newIds)];
      const detail = blocking
        .filter((v) => unique.includes(v.id))
        .map((v) => `- [${v.impact}] ${v.id}: ${v.help} — ${v.nodes.length} node(s)`)
        .join("\n");
      throw new Error(
        `axe-core regression on ${route} (${project}): ${unique.length} new violation(s) not in baseline:\n${detail}\n\n` +
          `If this is intentional, re-record the baseline with: UPDATE_E2E_BASELINE=1 pnpm --filter @cleanstart/web test:e2e`,
      );
    }
  });
}
