import { z } from 'zod';

const SLUG = /^[a-z0-9-]+$/;

export const applicationFieldsSchema = z.object({
  jobSlug: z.string().min(1).max(200).regex(SLUG),
  firstName: z.string().min(1).max(120),
  lastName: z.string().min(1).max(120),
  email: z.string().email().max(254),
  phone: z.string().max(40).optional(),
  coverLetter: z.string().max(5000).optional(),
  linkedinUrl: z.string().url().max(500).optional(),
  source: z.string().max(2048).optional(),
  consent: z
    .object({
      snapshot: z.string().max(2000),
      givenAt: z.string().max(40),
      categories: z.array(z.string().max(40)).max(10).optional(),
    })
    .optional(),
  turnstileToken: z.string().max(2048).optional(),
  website: z.string().max(2048).optional(),
});

export type ApplicationFields = z.infer<typeof applicationFieldsSchema>;
