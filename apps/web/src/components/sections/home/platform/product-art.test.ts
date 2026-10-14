import { describe, expect, it } from "vitest";
import { PRODUCT_ART, PRODUCT_KEYS, optimisedImageUrl, renderWidthFor } from "./product-art";

describe("product art", () => {
  it("measures a visible badge inside every file", () => {
    for (const key of PRODUCT_KEYS) {
      const { trim } = PRODUCT_ART[key];
      expect(trim.w).toBeGreaterThan(0.3);
      expect(trim.h).toBeGreaterThan(0.3);
      expect(trim.x + trim.w).toBeLessThanOrEqual(1);
      expect(trim.y + trim.h).toBeLessThanOrEqual(1);
    }
  });

  it("sizes the file so the badge is the requested height", () => {
    for (const key of PRODUCT_KEYS) {
      const w = renderWidthFor(key, 76);
      expect(w * PRODUCT_ART[key].trim.h).toBeCloseTo(76, 0);
    }
  });

  it("builds an optimiser url on an allowed width", () => {
    expect(optimisedImageUrl("/images/a b.webp")).toBe("/_next/image?url=%2Fimages%2Fa%20b.webp&w=384&q=75");
  });
});
