// Forms data layer — mirrors lib/resources.ts.

import { fetchCMS } from "./cms-fetch";

export type FormFieldType =
  | "text"
  | "email"
  | "textarea"
  | "select"
  | "checkbox"
  | "consent";

export interface FormFieldValidation {
  minLength?: number | null;
  maxLength?: number | null;
  pattern?: string | null;
}

export interface FormFieldConditionRule {
  fieldName: string;
  operator: "equals" | "notEquals" | "contains";
  value: string;
}

export interface FormFieldConditions {
  mode?: "all" | "any" | null;
  rules?: FormFieldConditionRule[] | null;
}

export interface FormFieldOption {
  label: string;
  value: string;
}

export interface FormField {
  name: string;
  type: FormFieldType;
  label?: string | null;
  required?: boolean | null;
  placeholder?: string | null;
  helpText?: string | null;
  defaultValue?: string | null;
  options?: FormFieldOption[] | null;
  consentText?: string | null;
  validation?: FormFieldValidation | null;
  conditions?: FormFieldConditions | null;
  errorMessage?: string | null;
}

export interface FormPostSubmit {
  kind: "message" | "redirect";
  body?: unknown;
  url?: string | null;
}

export interface Form {
  id: string | number;
  name: string;
  slug?: string | null;
  description?: string | null;
  fields: FormField[];
  submitLabel?: string | null;
  postSubmit?: FormPostSubmit | null;
  schemaVersion: number;
}

export async function getFormById(id: string | number): Promise<Form | null> {
  try {
    return await fetchCMS<Form>(`/api/forms/${id}?depth=1`);
  } catch {
    return null;
  }
}
