import { describe, expect, it } from "vitest";
import { initialsOf } from "./initials";

describe("initialsOf", () => {
  it.each([
    ["Aditi Rao", "AR"],
    ["Kestrel Systems", "KS"],
    ["Coralbay Technologies Pvt Ltd", "CT"],
    ["  Farhan   Qureshi ", "FQ"],
    ["CleanStart", "C"],
    ["", ""],
  ])("%j becomes %j", (name, expected) => {
    expect(initialsOf(name)).toBe(expected);
  });
});
