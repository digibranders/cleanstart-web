import { describe, expect, it } from "vitest";
import { FileText } from "lucide-react";
import { LEGAL_ICONS, legalIcon } from "@/components/sections/legal/legalIcons";
import { formatLegalDate, legalEffectiveDate } from "./legal";

describe("legal lib", () => {
  it("formats an ISO date as a US long date (UTC, no off-by-one)", () => {
    expect(formatLegalDate("2026-06-04T00:00:00.000Z")).toBe("June 4, 2026");
  });

  it("returns empty string for a missing date", () => {
    expect(formatLegalDate(null)).toBe("");
  });

  it("prefers effectiveDate over the publish-date chain", () => {
    expect(
      legalEffectiveDate({
        effectiveDate: "2026-06-04",
        displayPublishedAt: "2026-01-01",
        publishedAt: "2025-12-01",
      }),
    ).toBe("2026-06-04");
  });

  it("falls back to the publish chain when effectiveDate is absent", () => {
    expect(
      legalEffectiveDate({ effectiveDate: null, displayPublishedAt: "2026-02-02", publishedAt: null }),
    ).toBe("2026-02-02");
  });

  it("falls back to FileText for unknown icon keys", () => {
    expect(legalIcon("Nonexistent")).toBe(FileText);
    expect(legalIcon(null)).toBe(FileText);
  });

  it("maps the full CMS icon allow-list (parity guard)", () => {
    for (const key of [
      "FileText",
      "FileLock2",
      "ScrollText",
      "BadgeCheck",
      "FileCheck2",
      "Stamp",
      "Bug",
      "Scale",
      "FileSignature",
      "ShieldCheck",
    ]) {
      expect(LEGAL_ICONS[key]).toBeDefined();
    }
  });
});
