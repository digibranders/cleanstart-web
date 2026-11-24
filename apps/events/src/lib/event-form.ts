import { optionalText, requiredText } from "@/lib/forms/validate";
import { type PhoneValue, validatePhone } from "@/lib/forms/phone-value";

export type CabChoice = "yes" | "no" | "";

export interface EventFormValues {
  fullName: string;
  designation: string;
  company: string;
  cabRequired: CabChoice;
  pickupLocation: string;
  dropLocation: string;
}

export type EventFormField = keyof EventFormValues | "phone";
export type EventFormErrors = Partial<Record<EventFormField, string>>;

export const EMPTY_EVENT_FORM: EventFormValues = {
  fullName: "",
  designation: "",
  company: "",
  cabRequired: "",
  pickupLocation: "",
  dropLocation: "",
};

/** CMS field name (the `forms` row) for each form value. */
export const API_FIELD: Readonly<Record<EventFormField, string>> = {
  fullName: "full_name",
  designation: "designation",
  company: "company",
  phone: "phone",
  cabRequired: "cab_required",
  pickupLocation: "pickup_location",
  dropLocation: "drop_location",
};

export const FIELD_BY_API_NAME: Readonly<Record<string, EventFormField>> = Object.fromEntries(
  Object.entries(API_FIELD).map(([field, api]) => [api, field as EventFormField]),
);

/**
 * Pickup and drop are asked, and required, only when a cab is needed. The CMS
 * form carries the same condition, so the server enforces it too.
 */
export const validateEventForm = (
  values: EventFormValues,
  phone: PhoneValue,
): EventFormErrors => {
  const errors: EventFormErrors = {};
  const put = (field: EventFormField, message: string | null): void => {
    if (message) errors[field] = message;
  };

  put("fullName", requiredText(values.fullName, "Full name", { min: 2, max: 100 }));
  put("designation", requiredText(values.designation, "Designation", { max: 100 }));
  put("company", requiredText(values.company, "Company name", { max: 100 }));
  put("phone", validatePhone(phone, { required: true }));

  if (values.cabRequired === "") {
    errors.cabRequired = "Select whether you need a cab.";
  } else if (values.cabRequired === "yes") {
    put("pickupLocation", requiredText(values.pickupLocation, "Pick up location", { max: 200 }));
    put("dropLocation", requiredText(values.dropLocation, "Drop location", { max: 200 }));
  } else {
    put("pickupLocation", optionalText(values.pickupLocation, "Pick up location", { max: 200 }));
  }
  return errors;
};
