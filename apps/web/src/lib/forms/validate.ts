import { COMMON_FREE_EMAIL_DOMAINS, validateBusinessEmail } from "@cleanstart/forms";

/**
 * Client-side field rules for the marketing forms.
 *
 * These mirror what `apps/cms` enforces at `/api/leads/submit`; the server is
 * the gate, this is the fast feedback. Anything rejected here would also be
 * rejected there, so the two can never disagree in the direction that matters.
 */

export const requiredText = (
  value: string,
  label: string,
  { min = 1, max = 100 }: { min?: number; max?: number } = {},
): string | null => {
  const trimmed = value.trim();
  if (trimmed.length === 0) return `${label} is required.`;
  if (trimmed.length < min) return `${label} must be at least ${min} characters.`;
  if (trimmed.length > max) return `${label} must be ${max} characters or fewer.`;
  return null;
};

export const optionalText = (
  value: string,
  label: string,
  { max = 100 }: { max?: number } = {},
): string | null => {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > max) return `${label} must be ${max} characters or fewer.`;
  return null;
};

/**
 * @param requireBusiness pass false on the forms that legitimately accept a
 *        personal address (newsletter, gated downloads, job applications).
 */
export const emailError = (
  value: string,
  { requireBusiness = true }: { requireBusiness?: boolean } = {},
): string | null => {
  const result = validateBusinessEmail(value, {
    freeDomains: COMMON_FREE_EMAIL_DOMAINS,
    requireBusiness,
  });
  return result.ok ? null : result.message;
};

/**
 * Maps the field-level issues the lead API returns back onto the form, so a
 * domain that only the server's full list catches lands under the email field
 * rather than in a generic banner.
 */
export const issuesToErrors = (
  issues: readonly { fieldName: string; message: string }[] | undefined,
  fieldByApiName: Readonly<Record<string, string>>,
): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const issue of issues ?? []) {
    const field = fieldByApiName[issue.fieldName];
    if (field) out[field] = issue.message;
  }
  return out;
};
