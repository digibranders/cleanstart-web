import { z } from 'zod';

/**
 * Strict validator for the admin-only `seo.additionalSchema` raw JSON
 * override (Tier 3 of the Schema sidebar plan).
 *
 * Why this is locked down:
 *  - **Allowlisted `@type`** — schema.org has hundreds of types; most
 *    are dangerous to emit on a marketing CMS (medical, legal,
 *    governmental). Editors expand the allowlist via code, never via
 *    the form.
 *  - **No nested `@id` references** — `@id: "https://attacker.example"`
 *    can pull arbitrary external nodes into Google's understanding of
 *    the page (a documented schema-injection vector).
 *  - **16 KB cap** — schema.org blobs over a few KB are almost
 *    always copy-paste from another tool and break Rich Results
 *    eligibility silently. A hard cap forces editors to keep markup
 *    minimal.
 *
 * The validator is consumed by:
 *   1. The Payload field's server `validate` hook (blocks bad saves)
 *   2. The admin sidebar UI (live red error as the editor types)
 *   3. The dispatcher (defence-in-depth — re-validates before merging
 *      so a row written before allowlist contraction can't escape)
 */

/**
 * Schema.org @type values an admin can use in a manual override.
 * Add to this list deliberately — every entry is a commitment that
 * we'll keep emitting valid markup for that type going forward.
 *
 * Excluded by design:
 *  - Medical / legal / governmental types (`MedicalCondition`,
 *    `LegalService`, etc.) — outside our content surface.
 *  - Person / Organization / WebSite — these are auto-emitted by the
 *    dispatcher as Layer 1; allowing manual versions risks @id
 *    collisions with the auto blobs.
 *  - BreadcrumbList — handled by the breadcrumbList add-on block.
 */
export const ALLOWED_OVERRIDE_TYPES = [
  // Content + media types
  'Article',
  'NewsArticle',
  'TechArticle',
  'BlogPosting',
  'Book',
  'Course',
  'CreativeWork',
  'Dataset',
  'Recipe',
  'WebPage',
  'AboutPage',
  'ContactPage',
  'CollectionPage',
  // Editorial enrichment types
  'HowTo',
  'FAQPage',
  'QAPage',
  'Review',
  'AggregateRating',
  'VideoObject',
  'AudioObject',
  'PodcastEpisode',
  'PodcastSeries',
  // Software / product types
  'SoftwareApplication',
  'WebApplication',
  'MobileApplication',
  'Product',
  'Service',
  'Offer',
  // Event types
  'Event',
  'BusinessEvent',
  // Speakable
  'SpeakableSpecification',
] as const;

export type AllowedOverrideType = (typeof ALLOWED_OVERRIDE_TYPES)[number];

const SCHEMA_CONTEXT = 'https://schema.org';
const MAX_SERIALIZED_BYTES = 16 * 1024;
const ALLOWED_TYPE_SET = new Set<string>(ALLOWED_OVERRIDE_TYPES);

const isAllowedType = (value: unknown): value is AllowedOverrideType =>
  typeof value === 'string' && ALLOWED_TYPE_SET.has(value);

/**
 * Recursively scan a JSON value for `@id` keys. Used to enforce the
 * "no foreign @id references" rule — overrides may not reach into
 * arbitrary external graphs.
 */
const containsAtId = (value: unknown): boolean => {
  if (value == null) return false;
  if (Array.isArray(value)) {
    return value.some(containsAtId);
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (Object.prototype.hasOwnProperty.call(obj, '@id')) return true;
    return Object.values(obj).some(containsAtId);
  }
  return false;
};

/**
 * Single-blob schema. The override payload is either one of these
 * (carrying its own `@context`) or an array of them.
 */
const overrideBlobSchema: z.ZodType<{
  '@context': typeof SCHEMA_CONTEXT;
  '@type': AllowedOverrideType | readonly AllowedOverrideType[];
  [key: string]: unknown;
}> = z
  .object({
    '@context': z.literal(SCHEMA_CONTEXT, {
      message: `Top-level @context must be exactly "${SCHEMA_CONTEXT}".`,
    }),
    '@type': z.union([
      z.string().refine(isAllowedType, {
        message: '@type is not on the override allowlist. See ALLOWED_OVERRIDE_TYPES.',
      }),
      z
        .array(
          z.string().refine(isAllowedType, {
            message: '@type entries must all be on the override allowlist.',
          }),
        )
        .min(1),
    ]),
  })
  .passthrough() as unknown as z.ZodType<{
  '@context': typeof SCHEMA_CONTEXT;
  '@type': AllowedOverrideType | readonly AllowedOverrideType[];
  [key: string]: unknown;
}>;

/**
 * Top-level schema: object OR non-empty array of objects.
 */
export const overrideSchema = z.union([
  overrideBlobSchema,
  z.array(overrideBlobSchema).min(1, {
    message: 'Override must be a single object or a non-empty array of objects.',
  }),
]);

export type ValidatedOverride = z.infer<typeof overrideSchema>;

export interface OverrideValidationResult {
  ok: boolean;
  /** Human-readable error message; empty when ok. */
  message: string;
  /** Per-issue path. Useful for inline editor feedback. */
  issues: readonly { path: string; message: string }[];
}

/**
 * Run the full validation pipeline against a parsed JSON value.
 * Returns `{ ok: true, message: '', issues: [] }` for valid payloads.
 *
 * Designed to be safe for both:
 *  - Server-side `validate` hooks (return string on failure, true on success)
 *  - Client-side live feedback UIs (render `message` + `issues`)
 */
export const validateOverride = (input: unknown): OverrideValidationResult => {
  if (input == null) {
    return { ok: true, message: '', issues: [] };
  }

  // Size guard FIRST — running zod on a 5 MB blob is wasteful and
  // could DoS the form-save path.
  let serialized: string;
  try {
    serialized = JSON.stringify(input);
  } catch {
    return {
      ok: false,
      message: 'Override is not serialisable as JSON.',
      issues: [],
    };
  }
  const size = Buffer.byteLength(serialized, 'utf8');
  if (size > MAX_SERIALIZED_BYTES) {
    return {
      ok: false,
      message: `Override exceeds ${MAX_SERIALIZED_BYTES} bytes (got ${size}). Trim the payload — Schema.org markup over a few KB is almost always over-eager.`,
      issues: [],
    };
  }

  const parsed = overrideSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Override failed schema validation.',
      issues: parsed.error.issues.map((i) => ({
        path: i.path.length === 0 ? '(root)' : i.path.join('.'),
        message: i.message,
      })),
    };
  }

  // Defence-in-depth: scan for nested `@id`. We intentionally allow
  // the top-level `@id` (overrideSchema lets it pass via passthrough)
  // because it's safe to identify the page's own override blob — but
  // any nested @id is suspicious.
  const value = parsed.data;
  const hasNestedAtId = Array.isArray(value)
    ? value.some((blob) => {
        const { '@id': _, ...rest } = blob as Record<string, unknown>;
        return containsAtId(rest);
      })
    : (() => {
        const { '@id': _, ...rest } = value as Record<string, unknown>;
        return containsAtId(rest);
      })();

  if (hasNestedAtId) {
    return {
      ok: false,
      message:
        'Override may not contain nested @id references. Top-level @id is allowed, but nested @id can pull arbitrary external graphs into Google\'s understanding of this page.',
      issues: [],
    };
  }

  return { ok: true, message: '', issues: [] };
};

/**
 * Convenience adapter for Payload's field-level `validate` callback.
 * Payload expects `true` for valid or a string error message.
 */
export const validateOverrideForField = (
  value: unknown,
): true | string => {
  const result = validateOverride(value);
  if (result.ok) return true;
  const first = result.issues[0];
  if (!first) return result.message;
  return `${result.message} First issue at ${first.path}: ${first.message}`;
};
