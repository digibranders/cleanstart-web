import { describe, expect, it } from "vitest";

import { parseHubspotUtk } from "./hubspot-context";

const UTK = "0123456789abcdef0123456789ABCDEF";

describe("parseHubspotUtk", () => {
  it("reads the cookie among others", () => {
    expect(parseHubspotUtk(`a=1; hubspotutk=${UTK}; __hstc=999`)).toBe(UTK);
  });

  it("returns undefined when the cookie is absent", () => {
    expect(parseHubspotUtk("a=1; __hstc=999")).toBeUndefined();
    expect(parseHubspotUtk("")).toBeUndefined();
  });

  it("rejects a value that is not 32 hex characters", () => {
    expect(parseHubspotUtk("hubspotutk=not-a-token")).toBeUndefined();
    expect(parseHubspotUtk(`hubspotutk=${UTK}0`)).toBeUndefined();
  });

  it("does not match a cookie that only ends in the name", () => {
    expect(parseHubspotUtk(`x_hubspotutk=${UTK}`)).toBeUndefined();
  });
});
