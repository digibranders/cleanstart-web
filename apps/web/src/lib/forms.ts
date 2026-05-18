// Forms data layer — mirrors lib/resources.ts.

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

const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL ?? "http://localhost:3000";

export async function getFormById(id: string | number): Promise<Form | null> {
  try {
    const res = await fetch(`${CMS_URL}/api/forms/${id}?depth=1`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as Form;
  } catch {
    return null;
  }
}
