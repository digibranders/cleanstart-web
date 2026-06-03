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
  categories: {
    strictlyNecessary: true,
    performance: true,
    functional: true,
    targeting: true,
  },
  ts: "2026-06-03T00:00:00.000Z",
  gpc: false,
};

describe("encode/decode", () => {
  it("round-trips a record", () => {
    expect(decodeRecord(encodeRecord(base))).toEqual(base);
  });
  it("returns null for garbage", () => {
    expect(decodeRecord("not json")).toBeNull();
    expect(decodeRecord('{"v":2}')).toBeNull(); // missing required fields
  });
  it("returns null for the legacy 2-category shape", () => {
    const legacy = JSON.stringify({
      v: 1,
      id: "x",
      decision: "accept_all",
      categories: { essential: true, analytics: true },
      ts: base.ts,
      gpc: false,
    });
    expect(decodeRecord(legacy)).toBeNull();
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
  const opts = { id: "x", gpc: false, now: new Date(base.ts) };

  it("accept_all grants every optional category", () => {
    const r = recordFromDecision("accept_all", opts);
    expect(r.categories).toEqual({
      strictlyNecessary: true,
      performance: true,
      functional: true,
      targeting: true,
    });
  });
  it("reject_all clears every optional category", () => {
    const r = recordFromDecision("reject_all", opts);
    expect(r.categories).toEqual({
      strictlyNecessary: true,
      performance: false,
      functional: false,
      targeting: false,
    });
  });
  it("custom respects the per-category selection", () => {
    const r = recordFromDecision("custom", {
      ...opts,
      selection: { performance: true, functional: false, targeting: true },
    });
    expect(r.categories).toEqual({
      strictlyNecessary: true,
      performance: true,
      functional: false,
      targeting: true,
    });
  });
  it("custom defaults unspecified categories to false", () => {
    const r = recordFromDecision("custom", {
      ...opts,
      selection: { performance: true },
    });
    expect(r.categories.functional).toBe(false);
    expect(r.categories.targeting).toBe(false);
  });
});
