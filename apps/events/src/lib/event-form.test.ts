import { describe, expect, it } from "vitest";

import { EMPTY_EVENT_FORM, validateEventForm } from "./event-form";
import { emptyPhoneValue } from "./forms/phone-value";

const phone = { ...emptyPhoneValue(), national: "4155552671" };
const base = { ...EMPTY_EVENT_FORM, fullName: "Asha Rao", designation: "CISO", company: "Northwind" };

describe("validateEventForm", () => {
  it("requires a cab answer", () => {
    expect(validateEventForm(base, phone).cabRequired).toBeDefined();
  });

  it("does not ask for locations when no cab is needed", () => {
    const errors = validateEventForm({ ...base, cabRequired: "no" }, phone);
    expect(errors).toEqual({});
  });

  it("requires pickup and drop when a cab is needed", () => {
    const errors = validateEventForm({ ...base, cabRequired: "yes" }, phone);
    expect(errors.pickupLocation).toBeDefined();
    expect(errors.dropLocation).toBeDefined();
  });

  it("requires a phone number", () => {
    const errors = validateEventForm({ ...base, cabRequired: "no" }, emptyPhoneValue());
    expect(errors.phone).toBeDefined();
  });
});
