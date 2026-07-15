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
export const submitLeadBodySchema = z
  .object({
    // A submission targets its form by numeric `formId` (FormRenderer-driven
    // forms, which know the live id) OR by `formSlug` (the statically-built
    // marketing forms — the DB id differs across environments, so they key
    // on the stable slug and the endpoint resolves it server-side).
    formId: z.union([z.string().min(1), z.number().int().positive()]).optional(),
    formSlug: z
      .string()
      .min(1)
      .max(200)
      .regex(/^[a-z0-9-]+$/)
      .optional(),
    // Optional: FormRenderer sends the live schema version for staleness
    // detection. Slug-keyed forms omit it; the endpoint falls back to the
    // resolved form's current version.
    formSchemaVersion: z.number().int().nonnegative().optional(),
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
    // First-touch attribution + ad click IDs + device. `channel` is NOT
    // accepted here — the endpoint derives it server-side so it can't be
    // spoofed. Sizes mirror the last-touch `utm` caps.
    attribution: z
      .object({
        device: z.enum(['desktop', 'mobile', 'tablet']).optional(),
        gclid: z.string().max(512).optional(),
        fbclid: z.string().max(512).optional(),
        liFatId: z.string().max(512).optional(),
        firstTouch: z
          .object({
            source: z.string().max(256).optional(),
            medium: z.string().max(256).optional(),
            campaign: z.string().max(256).optional(),
            term: z.string().max(256).optional(),
            content: z.string().max(256).optional(),
            landingPage: z.string().max(2048).optional(),
            referrer: z.string().max(2048).optional(),
            at: z.string().datetime().optional(),
          })
          .optional(),
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
    turnstileToken: z.string().optional(),
    // Honeypot — invisible field on the rendered form. Bots fill it; humans
    // don't. The endpoint silently swallows any submission with a non-empty
    // value (returns 200 OK) so the bot doesn't learn it tripped the trap.
    website: z.string().max(2048).optional(),
    // Optional submission context — used today to signal a gated resource
    // download. When `resourceId` is present and matches the form's gateForm,
    // the lead-submit response includes a short-lived signed download token.
    context: z
      .object({
        resourceId: z.union([z.string().min(1), z.number().int().positive()]).optional(),
      })
      .optional(),
  })
  .refine((d) => d.formId != null || d.formSlug != null, {
    message: 'formId or formSlug is required',
    path: ['formId'],
  });

export type SubmitLeadBody = z.infer<typeof submitLeadBodySchema>;
