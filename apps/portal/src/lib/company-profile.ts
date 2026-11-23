import { z } from 'zod';
import { findCountry } from '@/lib/deal-form';
import { HEADCOUNT_BANDS } from '@/lib/domain';
import { isValidEmail } from '@/lib/people';

/** Logo rules, shared by the browser (fast feedback) and the server (the gate). SVG is refused on purpose: it can carry script. */
export const LOGO_MAX_BYTES = 1024 * 1024;
export const LOGO_TYPES: ReadonlyArray<{ ext: string; mime: string }> = [
  { ext: 'png', mime: 'image/png' },
  { ext: 'jpg', mime: 'image/jpeg' },
  { ext: 'jpeg', mime: 'image/jpeg' },
];
export const LOGO_ACCEPT = LOGO_TYPES.map((type) => `.${type.ext}`).join(',');
export const LOGO_TYPE_MESSAGE = 'Upload a PNG or JPG image.';

/** Same-origin URL of a company's logo, or null. The key is only a cache buster: the route reads the real one. */
export const logoUrlOf = (partnerId: string, logoKey: string | null): string | null =>
  logoKey ? `/api/partner-logo/${partnerId}?v=${encodeURIComponent(logoKey.slice(-12))}` : null;

const optionalText = (label: string, max: number) => z.string().trim().max(max, `${label} can be up to ${max} characters.`);
const optionalEmail = (label: string) =>
  z
    .string()
    .trim()
    .max(254, `${label} is too long.`)
    .refine((value) => value === '' || isValidEmail(value), `Enter a valid ${label.toLowerCase()}.`);

/** The editable company details. Empty string means "not set"; the repo stores it as null. Website, phone, address and about have their own form. */
export const companyDetailsFields = {
  legalName: optionalText('Legal name', 200),
  taxId: optionalText('Tax ID', 60),
  hqCountry: z
    .string()
    .trim()
    .refine((value) => value === '' || findCountry(value) !== null, 'Choose a country from the list.'),
  headcountBand: z.union([z.enum(HEADCOUNT_BANDS), z.literal('')]),
  billingContactName: optionalText('Billing contact name', 120),
  billingContactEmail: optionalEmail('Billing contact email'),
  supportContactName: optionalText('Support contact name', 120),
  supportContactEmail: optionalEmail('Support contact email'),
};

export const companyDetailsSchema = z.object(companyDetailsFields);
export type CompanyDetailsInput = z.infer<typeof companyDetailsSchema>;

/** hq_country is stored as the ISO code whichever way it was typed. */
export const normaliseDetails = (input: CompanyDetailsInput): CompanyDetailsInput => ({
  ...input,
  hqCountry: input.hqCountry === '' ? '' : (findCountry(input.hqCountry)?.code ?? input.hqCountry),
});
