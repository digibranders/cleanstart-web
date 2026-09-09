import { z } from 'zod';

import { attributionSchema, utmSchema } from '../attribution-schema';
import { emailField, optionalPhoneField } from '../form-field-schemas';

export const partnerSubmissionSchema = z.object({
  firstName: z.string().min(1).max(120),
  lastName: z.string().min(1).max(120),
  // Any valid address. A prospective partner is often an individual or a
  // small reseller applying before they have company mail set up, so the
  // company-email gate the demo and contact forms use costs more here than
  // the lead quality it buys.
  email: emailField({ requireBusiness: false }),
  phone: optionalPhoneField(),
  company: z.string().min(1).max(200),
  website: z.string().max(500).optional(),
  partnerReason: z.string().max(5000).optional(),
  source: z.string().max(2048).optional(),
  utm: utmSchema,
  attribution: attributionSchema,
  consent: z
    .object({
      snapshot: z.string().max(2000),
      givenAt: z.string().max(40),
      categories: z.array(z.string().max(40)).max(10).optional(),
    })
    .optional(),
  turnstileToken: z.string().max(2048).optional(),
  hp: z.string().max(2048).optional(),
});

export type PartnerSubmission = z.infer<typeof partnerSubmissionSchema>;
