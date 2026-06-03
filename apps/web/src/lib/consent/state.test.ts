import { describe, expect, it } from "vitest";

import { CONSENT_VERSION } from "./constants";
import {
  decodeRecord,
  encodeRecord,
  needsPrompt,
  recordFromDecision,
} from "./state";
import type { ConsentRecord } from "./types";

const base: ConsentRecord = {
  v: CONSENT_VERSION,
  id: "id-1",
  decision: "accept_all",
  categories: { essential: true, analytics: true },
  ts: "2026-06-03T00:00:00.000Z",
  gpc: false,
};

describe("encode/decode", () => {
  it("round-trips a record", () => {
    expect(decodeRecord(encodeRecord(base))).toEqual(base);
  });
  it("returns null for garbage", () => {
    expect(decodeRecord("not json")).toBeNull();
    expect(decodeRecord('{"v":1}')).toBeNull(); // missing required fields
  });
});

describe("needsPrompt", () => {
  const now = new Date("2026-06-03T00:00:00.000Z");
  it("prompts when no record", () => {
    expect(needsPrompt(null, now)).toBe(true);
  });
  it("prompts when version is stale", () => {
    expect(needsPrompt({ ...base, v: CONSENT_VERSION - 1 }, now)).toBe(true);
  });
  it("prompts when older than 12 months", () => {
    const old = { ...base, ts: "2025-05-01T00:00:00.000Z" };
    expect(needsPrompt(old, now)).toBe(true);
  });
  it("does not prompt for a fresh current record", () => {
    expect(needsPrompt(base, now)).toBe(false);
  });
});

describe("recordFromDecision", () => {
  it("reject_all clears analytics", () => {
    const r = recordFromDecision("reject_all", {
      gpc: false,
      id: "x",
      now: new Date(base.ts),
    });
    expect(r.categories.analytics).toBe(false);
    expect(r.decision).toBe("reject_all");
  });
  it("accept_all grants analytics", () => {
    const r = recordFromDecision("accept_all", {
      gpc: false,
      id: "x",
      now: new Date(base.ts),
    });
    expect(r.categories.analytics).toBe(true);
  });
  it("custom respects the analytics flag", () => {
    const r = recordFromDecision("custom", {
      gpc: false,
      id: "x",
      now: new Date(base.ts),
      analytics: true,
    });
    expect(r.categories.analytics).toBe(true);
  });
});
