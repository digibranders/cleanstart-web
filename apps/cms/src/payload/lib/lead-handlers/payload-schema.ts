import { z } from 'zod';

/**
 * Zod schema for the public-form POST body. Whatever crosses the
 * /api/leads/submit boundary is parsed through this — server code
 * downstream gets a typed, validated value or rejects the request.
 *
 * The `fields` map is kept loose (`Record<string, unknown>`) at the
 * boundary; the per-field validators on the matching Form (minLength /
 * maxLength / pattern) get re-applied server-side from the form
 * definition, not duplicated here.
 */
export const submitLeadBodySchema = z.object({
  formId: z.union([z.string().min(1), z.number().int().positive()]),
  formSchemaVersion: z.number().int().nonnegative(),
  fields: z.record(z.string(), z.unknown()),
  source: z.string().max(2048).optional(),
  utm: z
    .object({
      campaign: z.string().max(256).optional(),
      source: z.string().max(256).optional(),
      medium: z.string().max(256).optional(),
      term: z.string().max(256).optional(),
      content: z.string().max(256).optional(),
    })
    .optional(),
  consent: z
    .object({
      givenAt: z.string().datetime(),
      snapshot: z.string().min(1).max(4096),
      policyVersion: z.string().max(64).optional(),
      categories: z.array(z.string().max(64)).max(20).optional(),
    })
    .optional(),
  // Spam protection — verified server-side. Required at submit time even
  // when blank in dev, so the public site always posts the field.
  turnstileToken: z.string().min(0).optional(),
});

export type SubmitLeadBody = z.infer<typeof submitLeadBodySchema>;
