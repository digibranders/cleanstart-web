import { describe, expect, it } from "vitest";
import { FOCUSABLE_SELECTOR, focusReturnTarget, isInertExempt, trapTarget } from "./focus-trap";

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

describe("isInertExempt", () => {
  const el = (tag: string, classes: string[] = [], inert = false) => ({ tag, classes, inert });

  it("leaves the click-away layers, the toast and page furniture alone", () => {
    expect(isInertExempt(el("DIV", ["cs-scrim"]))).toBe(true);
    expect(isInertExempt(el("DIV", ["dd-scrim"]))).toBe(true);
    expect(isInertExempt(el("DIV", ["toast"]))).toBe(true);
    expect(isInertExempt(el("SCRIPT"))).toBe(true);
    expect(isInertExempt(el("STYLE"))).toBe(true);
    expect(isInertExempt(el("NEXT-ROUTE-ANNOUNCER"))).toBe(true);
    expect(isInertExempt(el("NEXTJS-PORTAL"))).toBe(true);
  });

  it("leaves an element that is already inert alone, so it is not un-inerted later", () => {
    expect(isInertExempt(el("DIV", [], true))).toBe(true);
  });

  it("makes page content inert, including wrappers that merely contain a status note", () => {
    expect(isInertExempt(el("DIV", ["app"]))).toBe(false);
    expect(isInertExempt(el("SECTION", ["card", "note"]))).toBe(false);
    expect(isInertExempt(el("MAIN"))).toBe(false);
  });
});

describe("focusReturnTarget", () => {
  it("returns focus to the opener while it is still on the page", () => {
    expect(focusReturnTarget({ isConnected: true, id: "opener" }, { isConnected: true, id: "main" })?.id).toBe("opener");
  });

  it("falls back when the opener has been removed, for example an approved row", () => {
    expect(focusReturnTarget({ isConnected: false, id: "opener" }, { isConnected: true, id: "main" })?.id).toBe("main");
    expect(focusReturnTarget(null, { isConnected: true, id: "main" })?.id).toBe("main");
  });

  it("returns null when there is nowhere to go", () => {
    expect(focusReturnTarget(null, null)).toBeNull();
  });
});

describe("FOCUSABLE_SELECTOR", () => {
  const parts = FOCUSABLE_SELECTOR.split(/,\s*/);

  it.each(["a[href]", "summary", "iframe", 'input:not([disabled]):not([type=hidden])', '[tabindex]:not([tabindex="-1"])'])("includes %s", (part) => {
    expect(parts).toContain(part);
  });

  it("includes editable regions but not ones switched off", () => {
    expect(parts).toContain('[contenteditable]:not([contenteditable="false"])');
  });
});
