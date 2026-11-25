import { describe, expect, it } from "vitest";

import type { FormField } from "./cms";
import { isVisible, validateForm } from "./form-engine";
import { emptyPhoneValue } from "./forms/phone-value";

const base = {
  placeholder: null,
  helpText: null,
  options: [],
  minLength: null,
  maxLength: null,
  requireBusinessEmail: false,
  conditions: { mode: "all" as const, rules: [] },
};

const cab: FormField = {
  ...base,
  name: "cab",
  type: "select",
  label: "Cab",
  required: true,
  options: [
    { label: "Yes", value: "yes" },
    { label: "No", value: "no" },
  ],
};
const pickup: FormField = {
  ...base,
  name: "pickup",
  type: "text",
  label: "Pick up",
  required: true,
  conditions: { mode: "all", rules: [{ fieldName: "cab", operator: "equals", value: "yes" }] },
};
const phone: FormField = { ...base, name: "phone", type: "tel", label: "Phone", required: true };
const agree: FormField = { ...base, name: "agree", type: "consent", label: "Agreement", required: true };

describe("form engine", () => {
  it("shows a conditional field only when its rule matches", () => {
    expect(isVisible(pickup, { cab: "yes" })).toBe(true);
    expect(isVisible(pickup, { cab: "no" })).toBe(false);
  });

  it("does not ask for a hidden field", () => {
    const errors = validateForm([cab, pickup], { cab: "no" }, {});
    expect(errors).toEqual({});
  });

  it("asks for it once it is shown", () => {
    const errors = validateForm([cab, pickup], { cab: "yes", pickup: "" }, {});
    expect(Object.keys(errors)).toEqual(["pickup"]);
  });

  it("requires a select answer, a phone and an agreement", () => {
    const errors = validateForm([cab, phone, agree], { cab: "", agree: false }, { phone: emptyPhoneValue() });
    expect(Object.keys(errors).sort()).toEqual(["agree", "cab", "phone"]);
  });
});
