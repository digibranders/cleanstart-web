import { describe, expect, it } from "vitest";

import { THANK_YOU_CONTENT } from "./content";
import { THANK_YOU_TYPES, isThankYouType, thankYouTypeSchema } from "./types";

describe("thank-you types", () => {
  it("covers exactly the four redirecting forms", () => {
    expect([...THANK_YOU_TYPES]).toEqual([
      "book-a-demo",
      "contact",
      "deal-registration",
      "job-application",
    ]);
  });

  it("rejects anything else, so an unknown segment 404s", () => {
    expect(isThankYouType("newsletter")).toBe(false);
    expect(isThankYouType("become-a-partner")).toBe(false);
    expect(thankYouTypeSchema.safeParse("../etc/passwd").success).toBe(false);
  });
});

describe("thank-you content", () => {
  it("has an entry for every type", () => {
    for (const type of THANK_YOU_TYPES) {
      expect(THANK_YOU_CONTENT[type]).toBeDefined();
    }
  });

  it("gives every entry both CTAs pointing at real internal paths", () => {
    for (const type of THANK_YOU_TYPES) {
      const c = THANK_YOU_CONTENT[type];
      for (const cta of [c.primary, c.secondary]) {
        expect(cta.label.length).toBeGreaterThan(0);
        expect(cta.href.startsWith("/")).toBe(true);
      }
    }
  });

  // CLAUDE.md bans em-dashes in prose. Asserting it here makes the rule
  // enforceable rather than a convention someone has to remember.
  it("uses no em-dashes or en-dashes in any visitor-facing string", () => {
    for (const type of THANK_YOU_TYPES) {
      for (const value of Object.values(THANK_YOU_CONTENT[type])) {
        const text = typeof value === "string" ? value : JSON.stringify(value);
        expect(text).not.toMatch(/[—–]/);
      }
    }
  });
});
