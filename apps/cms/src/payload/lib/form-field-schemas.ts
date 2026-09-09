import { FREE_EMAIL_DOMAINS, isE164, validateBusinessEmail } from '@cleanstart/forms/server';
import { z } from 'zod';

/**
 * Shared Zod field shapes for the public form endpoints that own their own
 * schema (partner applications, deal registrations, career applications).
 *
 * The `/api/leads/submit` endpoint does not use these: its rules come from the
 * `forms` collection field definitions and are applied by `validate-fields.ts`.
 * Both paths call the same `@cleanstart/forms` validators underneath, so a rule
 * cannot drift between them.
 */

/**
 * @param requireBusiness false on the career-application form, where an
 *        applicant's personal address is the norm and demanding their
 *        employer's would exclude most candidates.
 */
export const emailField = ({ requireBusiness }: { requireBusiness: boolean }) =>
  z
    .string()
    .max(254)
    .superRefine((value, ctx) => {
      const result = validateBusinessEmail(value, {
        freeDomains: FREE_EMAIL_DOMAINS,
        requireBusiness,
      });
      if (!result.ok) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.message });
      }
    });

/**
 * A phone number in E.164, as the browser's phone field composes it from the
 * selected country's dial code plus the digits typed.
 *
 * The 40-character ceiling stays for defence in depth even though E.164 caps
 * at 16 characters, so a hostile payload is rejected on length before the
 * regex runs.
 */
export const optionalPhoneField = () =>
  z
    .string()
    .max(40)
    .optional()
    .superRefine((value, ctx) => {
      if (value === undefined || value.length === 0) return;
      if (!isE164(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Phone number must include its country code, for example +14155552671.',
        });
      }
    });
