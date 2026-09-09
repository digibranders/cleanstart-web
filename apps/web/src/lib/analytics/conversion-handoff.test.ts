import { beforeEach, describe, expect, it } from "vitest";

import {
  __resetConversionHandoff,
  armConversion,
  claimConversion,
} from "./conversion-handoff";

beforeEach(__resetConversionHandoff);

describe("conversion handoff", () => {
  it("claims once and only once", () => {
    armConversion("book-a-demo");
    expect(claimConversion("book-a-demo")).toBe(true);
    // A refresh or back/forward must not re-fire the conversion.
    expect(claimConversion("book-a-demo")).toBe(false);
  });

  it("does not claim when nothing was armed: a direct hit fires nothing", () => {
    expect(claimConversion("contact")).toBe(false);
  });

  it("does not claim on a type mismatch", () => {
    armConversion("contact");
    expect(claimConversion("book-a-demo")).toBe(false);
    // The original arm survives a mismatched claim.
    expect(claimConversion("contact")).toBe(true);
  });

  it("keeps only the latest arm", () => {
    armConversion("contact");
    armConversion("deal-registration");
    expect(claimConversion("contact")).toBe(false);
    expect(claimConversion("deal-registration")).toBe(true);
  });
});
