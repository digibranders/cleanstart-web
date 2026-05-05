/**
 * Server-side re-application of `forms.fields[].validation` rules.
 *
 * The public-form HTML enforces these client-side; this re-validates
 * the same rules server-side so a tampered DOM or hand-crafted POST
 * can't ship junk into the leads table.
 *
 * Returns `{ ok: true }` when every rule passes, or
 * `{ ok: false, issues: [...] }` listing every violation. The endpoint
 * surfaces the issues to the caller as a 400 response so the client
 * can map them back onto fields.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type FormFieldDef = {
  name?: string | null;
  type?: string | null;
  label?: string | null;
  required?: boolean | null;
  options?: { label?: string | null; value?: string | null }[] | null;
  validation?: {
    minLength?: number | null;
    maxLength?: number | null;
    pattern?: string | null;
  } | null;
};

export type FieldIssue = {
  fieldName: string;
  message: string;
};

export type FieldsValidationResult =
  | { ok: true }
  | { ok: false; issues: FieldIssue[] };

const labelOrName = (def: FormFieldDef): string =>
  def.label?.trim() || def.name || 'this field';

const stringLengthOk = (
  value: string,
  rule: { minLength?: number | null; maxLength?: number | null },
): true | string => {
  if (rule.minLength != null && value.length < rule.minLength) {
    return `must be at least ${rule.minLength} characters`;
  }
  if (rule.maxLength != null && value.length > rule.maxLength) {
    return `must be ${rule.maxLength} characters or fewer`;
  }
  return true;
};

const patternOk = (value: string, rawPattern: string | null | undefined): true | string => {
  if (!rawPattern) return true;
  try {
    const re = new RegExp(rawPattern);
    return re.test(value) ? true : 'does not match the required format';
  } catch {
    // Invalid stored pattern — treat as no rule rather than blocking the visitor.
    return true;
  }
};

export const validateFields = (
  defs: FormFieldDef[],
  values: Record<string, unknown>,
): FieldsValidationResult => {
  const issues: FieldIssue[] = [];

  for (const def of defs) {
    if (!def?.name) continue;
    const value = values[def.name];
    const label = labelOrName(def);

    if (def.type === 'consent') {
      if (def.required !== false && value !== true) {
        issues.push({ fieldName: def.name, message: `${label} must be agreed to.` });
      }
      continue;
    }

    if (def.required) {
      if (
        value === undefined ||
        value === null ||
        (typeof value === 'string' && value.trim().length === 0) ||
        (def.type === 'checkbox' && value !== true)
      ) {
        issues.push({ fieldName: def.name, message: `${label} is required.` });
        continue;
      }
    }

    if (value === undefined || value === null) continue;

    if (def.type === 'email') {
      if (typeof value !== 'string' || !EMAIL_RE.test(value)) {
        issues.push({ fieldName: def.name, message: `${label} must be a valid email address.` });
        continue;
      }
    }

    if (def.type === 'select') {
      const allowed = (def.options ?? [])
        .map((option) => option?.value)
        .filter((v): v is string => typeof v === 'string');
      if (typeof value !== 'string' || !allowed.includes(value)) {
        issues.push({
          fieldName: def.name,
          message: `${label} must be one of the allowed options.`,
        });
        continue;
      }
    }

    if (
      typeof value === 'string' &&
      (def.type === 'text' || def.type === 'email' || def.type === 'textarea')
    ) {
      const v = def.validation ?? {};
      const lengthCheck = stringLengthOk(value, v);
      if (lengthCheck !== true) {
        issues.push({ fieldName: def.name, message: `${label} ${lengthCheck}.` });
        continue;
      }
      const pat = patternOk(value, v.pattern);
      if (pat !== true) {
        issues.push({ fieldName: def.name, message: `${label} ${pat}.` });
      }
    }

    if (def.type === 'checkbox' && typeof value !== 'boolean') {
      issues.push({ fieldName: def.name, message: `${label} must be true or false.` });
    }
  }

  if (issues.length === 0) return { ok: true };
  return { ok: false, issues };
};
