import { z } from 'zod';

const person = z.object({
  firstName: z.string().min(1).max(120),
  lastName: z.string().min(1).max(120),
  email: z.string().email().max(254),
  phone: z.string().max(40).optional(),
});

export const dealRegistrationSchema = z.object({
  partnerName: z.string().min(1).max(200),
  partnerRep: person,
  prospect: person,
  dealDetails: z.string().max(5000).optional(),
  source: z.string().max(2048).optional(),
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

export type DealRegistrationSubmission = z.infer<typeof dealRegistrationSchema>;
