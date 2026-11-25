import type { FormField } from "@/lib/cms";
import { emailError, requiredText } from "@/lib/forms/validate";
import { type PhoneValue, emptyPhoneValue, validatePhone } from "@/lib/forms/phone-value";

/** Visitor answers: text for most fields, true/false for checkboxes. Phones live apart. */
export type Values = Record<string, string | boolean>;
export type Phones = Record<string, PhoneValue>;
export type Errors = Record<string, string>;

const ruleMatches = (rule: FormField["conditions"]["rules"][number], values: Values): boolean => {
  const actual = String(values[rule.fieldName] ?? "");
  if (rule.operator === "notEquals") return actual !== rule.value;
  if (rule.operator === "contains") return actual.includes(rule.value);
  return actual === rule.value;
};

/** Same rule the CMS applies: a field with no rules is always shown. */
export const isVisible = (field: FormField, values: Values): boolean => {
  const { mode, rules } = field.conditions;
  if (rules.length === 0) return true;
  return mode === "any" ? rules.some((r) => ruleMatches(r, values)) : rules.every((r) => ruleMatches(r, values));
};

export const isToggle = (field: FormField): boolean => field.type === "checkbox" || field.type === "consent";

/** Fast feedback only; the CMS re-checks every rule and returns per-field issues. */
export const validateForm = (fields: readonly FormField[], values: Values, phones: Phones): Errors => {
  const errors: Errors = {};
  for (const field of fields) {
    if (!isVisible(field, values)) continue;
    const value = values[field.name];

    if (isToggle(field)) {
      if (field.required && value !== true) errors[field.name] = `${field.label} must be agreed to.`;
      continue;
    }

    if (field.type === "tel") {
      const message = validatePhone(phones[field.name] ?? emptyPhoneValue(), { required: field.required });
      if (message) errors[field.name] = message;
      continue;
    }

    const text = typeof value === "string" ? value.trim() : "";

    if (field.type === "select") {
      if (text === "") {
        if (field.required) errors[field.name] = `Select ${field.label.toLowerCase()}.`;
      } else if (!field.options.some((o) => o.value === text)) {
        errors[field.name] = `${field.label} must be one of the options.`;
      }
      continue;
    }

    if (field.type === "email") {
      const message = text === "" && !field.required ? null : emailError(text, { requireBusiness: field.requireBusinessEmail });
      if (message) errors[field.name] = message;
      continue;
    }

    if (field.required || text !== "") {
      const message = requiredText(text, field.label, { min: field.minLength ?? 1, max: field.maxLength ?? 500 });
      if (message) errors[field.name] = message;
    }
  }
  return errors;
};
