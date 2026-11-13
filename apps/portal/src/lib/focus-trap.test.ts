import { describe, expect, it } from "vitest";
import { trapTarget } from "./focus-trap";

const items = ["close", "name", "save"];

describe("trapTarget", () => {
  it("wraps Tab from the last item to the first", () => {
    expect(trapTarget(items, "save", false)).toBe("close");
  });

  it("wraps Shift+Tab from the first item to the last", () => {
    expect(trapTarget(items, "close", true)).toBe("save");
  });

  it("lets the browser move between items in the middle", () => {
    expect(trapTarget(items, "name", false)).toBeNull();
    expect(trapTarget(items, "name", true)).toBeNull();
    expect(trapTarget(items, "close", false)).toBeNull();
    expect(trapTarget(items, "save", true)).toBeNull();
  });

  it("pulls focus back in when it is outside the list", () => {
    expect(trapTarget(items, "page-link", false)).toBe("close");
    expect(trapTarget(items, "page-link", true)).toBe("save");
    expect(trapTarget(items, null, false)).toBe("close");
    expect(trapTarget(items, null, true)).toBe("save");
  });

  it("keeps a single item as the only stop", () => {
    expect(trapTarget(["only"], "only", false)).toBe("only");
    expect(trapTarget(["only"], "only", true)).toBe("only");
  });

  it("does nothing when there is nothing to focus", () => {
    expect(trapTarget([], null, false)).toBeNull();
    expect(trapTarget([], null, true)).toBeNull();
  });
});
