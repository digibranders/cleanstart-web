import { describe, expect, it } from "vitest";

import { findCountry, PHONE_COUNTRIES, searchCountries, type PhoneCountry } from "./countries";
import {
  digitsOnly,
  formatNational,
  maxNationalDigits,
  parseInternational,
  toE164,
  validatePhone,
} from "./phone-value";

const country = (code: string): PhoneCountry => {
  const found = findCountry(code);
  if (!found) throw new Error(`Missing country ${code}`);
  return found;
};

describe("countries", () => {
  it("carries every dialable country with a flag and a name", () => {
    expect(PHONE_COUNTRIES.length).toBeGreaterThan(200);
    for (const entry of PHONE_COUNTRIES) {
      expect(entry.callingCode).toMatch(/^\d+$/);
      expect(entry.flag).toHaveLength(4); // two surrogate pairs
      expect(entry.name.length).toBeGreaterThan(1);
    }
  });

  it("resolves names rather than falling back to the ISO code", () => {
    expect(country("IN").name).toBe("India");
    expect(country("US").callingCode).toBe("1");
    expect(country("GB").callingCode).toBe("44");
  });

  it("searches by name, ISO code and dial code", () => {
    expect(searchCountries("ind").some((c) => c.code === "IN")).toBe(true);
    expect(searchCountries("IN").some((c) => c.code === "IN")).toBe(true);
    expect(searchCountries("+91").some((c) => c.code === "IN")).toBe(true);
    expect(searchCountries("91").some((c) => c.code === "IN")).toBe(true);
    expect(searchCountries("zzzz")).toHaveLength(0);
  });
});

describe("digitsOnly", () => {
  it("drops everything that is not a digit, so no text survives", () => {
    expect(digitsOnly("+1 (415) 555-2671")).toBe("14155552671");
    expect(digitsOnly("abc")).toBe("");
    expect(digitsOnly("9876 abc 543210")).toBe("9876543210");
  });
});

describe("formatNational", () => {
  // The trunk-prefix strip is a heuristic, so pin the behaviour across plans
  // that do and do not use one.
  it.each([
    ["US", "4155552671"],
    ["GB", "2071838750"],
    ["IN", "9876543210"],
    ["DE", "15112345678"],
    ["FR", "612345678"],
    ["AU", "412345678"],
    ["BR", "11961234567"],
    ["JP", "9012345678"],
    ["SG", "81234567"],
  ])("keeps every typed digit for %s", (code, national) => {
    const formatted = formatNational({ country: country(code), national });
    expect(formatted.replace(/\D/gu, "")).toBe(national);
  });

  it("returns an empty string for no digits", () => {
    expect(formatNational({ country: country("US"), national: "" })).toBe("");
  });
});

describe("toE164", () => {
  it("composes the dial code and the national digits", () => {
    expect(toE164({ country: country("IN"), national: "9876543210" })).toBe("+919876543210");
    expect(toE164({ country: country("US"), national: "4155552671" })).toBe("+14155552671");
  });

  it("returns null for digits that are not a real number in that country", () => {
    expect(toE164({ country: country("US"), national: "1" })).toBeNull();
    expect(toE164({ country: country("US"), national: "" })).toBeNull();
  });
});

describe("validatePhone", () => {
  it("requires a number only when the field is required", () => {
    const empty = { country: country("US"), national: "" };
    expect(validatePhone(empty, { required: true })).toBe("Phone number is required.");
    expect(validatePhone(empty, { required: false })).toBeNull();
  });

  it("rejects digits that do not form a number in the selected country", () => {
    expect(validatePhone({ country: country("US"), national: "123" }, { required: true })).toBe(
      "Enter a valid phone number for the country you selected.",
    );
  });

  it("accepts a valid number", () => {
    expect(
      validatePhone({ country: country("IN"), national: "9876543210" }, { required: true }),
    ).toBeNull();
  });
});

describe("maxNationalDigits", () => {
  it("leaves room for the dial code inside the 15-digit E.164 ceiling", () => {
    expect(maxNationalDigits(country("US"))).toBe(14); // +1
    expect(maxNationalDigits(country("IN"))).toBe(13); // +91
  });
});

describe("formatNational grouping", () => {
  it.each([
    ["US", "4155552671", "415 555 2671"],
    ["GB", "2071838750", "20 7183 8750"],
    ["IN", "9876543210", "98765 43210"],
    ["FR", "612345678", "6 12 34 56 78"],
    ["AU", "412345678", "412 345 678"],
    ["JP", "9012345678", "90 1234 5678"],
  ])("groups %s digits without inventing a trunk prefix", (code, national, expected) => {
    expect(formatNational({ country: country(code), national })).toBe(expected);
  });
});

describe("parseInternational", () => {
  it("adopts the country from a pasted international number", () => {
    expect(parseInternational("+44 20 7183 8750")).toEqual({
      country: country("GB"),
      national: "2071838750",
    });
  });

  it("accepts the 00 trunk form", () => {
    expect(parseInternational("0044 20 7183 8750")).toEqual({
      country: country("GB"),
      national: "2071838750",
    });
  });

  it("returns null for plain national digits, which stay with the chosen country", () => {
    expect(parseInternational("2071838750")).toBeNull();
    expect(parseInternational("")).toBeNull();
    expect(parseInternational("+")).toBeNull();
    expect(parseInternational("+999999")).toBeNull();
  });
});
