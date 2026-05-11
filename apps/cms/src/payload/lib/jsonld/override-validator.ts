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
  // Article variants
  'Article',
  'NewsArticle',
  'TechArticle',
  'BlogPosting',
  'CreativeWork',
  // WebPage variants
  'WebPage',
  'AboutPage',
  'ContactPage',
  'CollectionPage',
  // Editorial / rich-result types
  'HowTo',
  'FAQPage',
  'QAPage',
  'VideoObject',
  // Education (low-risk; drop if SEO confirms no surface)
  'Course',
  'Dataset',
  // Product / app types
  'SoftwareApplication',
  'WebApplication',
  'Service',
  // Speakable
  'SpeakableSpecification',
  // Per-collection-gated (see COLLECTION_RESTRICTED_TYPES)
  'ProfilePage',
  'Review',
  'AggregateRating',
] as const;

export type AllowedOverrideType = (typeof ALLOWED_OVERRIDE_TYPES)[number];

const SCHEMA_CONTEXT = 'https://schema.org';
const MAX_SERIALIZED_BYTES = 16 * 1024;
const ALLOWED_TYPE_SET = new Set<string>(ALLOWED_OVERRIDE_TYPES);

const isAllowedType = (value: unknown): value is AllowedOverrideType =>
  typeof value === 'string' && ALLOWED_TYPE_SET.has(value);

/**
 * Collection-scoped restrictions. Types listed here are valid ONLY
 * when the collection slug is in the corresponding set; types with
 * an empty set are unrestricted (allowed on every collection).
 *
 *  - `ProfilePage` → Google's 2024 author-profile rich-result type;
 *    only makes sense on author detail pages.
 *  - `Review` / `AggregateRating` → manual-action triggers when used
 *    without a reviewable subject (Google March 2026 enforcement).
 *    Limited to surfaces where the subject genuinely exists.
 */
const COLLECTION_RESTRICTED_TYPES: Readonly<Record<AllowedOverrideType, ReadonlySet<string>>> = {
  ProfilePage: new Set(['authors']),
  Review: new Set(['resources', 'events', 'webinars']),
  AggregateRating: new Set(['resources', 'events', 'webinars']),
  Article: new Set(),
  NewsArticle: new Set(),
  TechArticle: new Set(),
  BlogPosting: new Set(),
  CreativeWork: new Set(),
  WebPage: new Set(),
  AboutPage: new Set(),
  ContactPage: new Set(),
  CollectionPage: new Set(),
  HowTo: new Set(),
  FAQPage: new Set(),
  QAPage: new Set(),
  VideoObject: new Set(),
  Course: new Set(),
  Dataset: new Set(),
  SoftwareApplication: new Set(),
  WebApplication: new Set(),
  Service: new Set(),
  SpeakableSpecification: new Set(),
};

const isAllowedForCollection = (
  type: AllowedOverrideType,
  collectionSlug: string | null,
): boolean => {
  const restricted = COLLECTION_RESTRICTED_TYPES[type];
  if (restricted.size === 0) return true;
  return collectionSlug != null && restricted.has(collectionSlug);
};

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

const collectTypes = (input: ValidatedOverride): AllowedOverrideType[] => {
  const blobs = Array.isArray(input) ? input : [input];
  const out: AllowedOverrideType[] = [];
  for (const blob of blobs) {
    const t = blob['@type'];
    if (typeof t === 'string') out.push(t);
    else for (const entry of t) out.push(entry);
  }
  return out;
};

/**
 * Same as `validateOverride` plus a per-collection check for
 * collection-restricted `@type` values (`Review`, `AggregateRating`,
 * `ProfilePage`). Pass `null` for `collectionSlug` when the slug is
 * unknown — restricted types are rejected (fail closed).
 */
export const validateOverrideForCollection = (
  input: unknown,
  collectionSlug: string | null,
): OverrideValidationResult => {
  const base = validateOverride(input);
  if (!base.ok || input == null) return base;
  const parsed = overrideSchema.safeParse(input);
  if (!parsed.success) return base;
  const types = collectTypes(parsed.data);
  const offenders = types.filter((t) => !isAllowedForCollection(t, collectionSlug));
  if (offenders.length === 0) return base;
  const unique = Array.from(new Set(offenders));
  return {
    ok: false,
    message: `@type ${unique.map((t) => `"${t}"`).join(', ')} not allowed on collection "${collectionSlug ?? '(unknown)'}". Allowed only on: ${unique
      .map((t) => `${t} → [${Array.from(COLLECTION_RESTRICTED_TYPES[t]).join(', ')}]`)
      .join('; ')}.`,
    issues: unique.map((t) => ({
      path: '@type',
      message: `"${t}" is restricted to: ${Array.from(COLLECTION_RESTRICTED_TYPES[t]).join(', ')}`,
    })),
  };
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

/** Collection-aware variant of `validateOverrideForField`. */
export const validateOverrideForFieldOnCollection = (
  collectionSlug: string,
) => (value: unknown): true | string => {
  const result = validateOverrideForCollection(value, collectionSlug);
  if (result.ok) return true;
  const first = result.issues[0];
  if (!first) return result.message;
  return `${result.message} First issue at ${first.path}: ${first.message}`;
};

export interface LenientParseSuccess {
  ok: true;
  data: unknown;
  warnings: readonly string[];
}
export interface LenientParseFailure {
  ok: false;
  message: string;
  line?: number;
  column?: number;
}
export type LenientParseResult = LenientParseSuccess | LenientParseFailure;

const SCRIPT_TAG_RE = /<script\b[^>]*type=["']application\/(ld\+)?json["'][^>]*>([\s\S]*?)<\/script>/i;
const SCRIPT_TAG_GLOBAL_RE = /<script\b[^>]*type=["']application\/(?:ld\+)?json["'][^>]*>([\s\S]*?)<\/script>/gi;
const TRAILING_COMMA_RE = /,(\s*[\]\}])/g;

const tryParseOne = (
  text: string,
  warnings: string[],
): LenientParseResult => {
  try {
    return { ok: true, data: JSON.parse(text) as unknown, warnings };
  } catch (err) {
    const stripped = text.replace(TRAILING_COMMA_RE, '$1');
    if (stripped !== text) {
      try {
        const data = JSON.parse(stripped) as unknown;
        return {
          ok: true,
          data,
          warnings: [...warnings, 'Removed JSON5-style trailing commas.'],
        };
      } catch {
        // fall through
      }
    }
    const message = err instanceof SyntaxError ? err.message : 'JSON parse failed.';
    const positionMatch = /position\s+(\d+)/i.exec(message);
    if (positionMatch?.[1]) {
      const pos = Number.parseInt(positionMatch[1], 10);
      const prefix = text.slice(0, pos);
      const line = prefix.split('\n').length;
      const column = pos - prefix.lastIndexOf('\n');
      return { ok: false, message, line, column };
    }
    return { ok: false, message };
  }
};

const normaliseContextHttps = (text: string, warnings: string[]): string => {
  const httpContext = /"@context"\s*:\s*"http:\/\/schema\.org"/g;
  if (!httpContext.test(text)) return text;
  warnings.push('Normalised @context from http:// to https://schema.org.');
  return text.replace(httpContext, '"@context": "https://schema.org"');
};

/**
 * Tolerant single-blob parser for pastes from external Schema.org
 * generators. Strips one wrapping `<script type="application/ld+json">`
 * tag, normalises `http://schema.org` to `https://`, removes trailing
 * commas as a fallback, reports line/column on failure.
 */
export const parseLenient = (input: string): LenientParseResult => {
  if (typeof input !== 'string') {
    return { ok: false, message: 'parseLenient expected a string input.' };
  }
  const warnings: string[] = [];
  let text = input.trim();
  if (text.length === 0) {
    return { ok: false, message: 'Input is empty.' };
  }

  const scriptMatch = SCRIPT_TAG_RE.exec(text);
  if (scriptMatch && typeof scriptMatch[2] === 'string') {
    text = scriptMatch[2].trim();
    warnings.push('Stripped wrapping <script type="application/ld+json"> tag.');
  }
  text = normaliseContextHttps(text, warnings);
  return tryParseOne(text, warnings);
};

export interface MultiBlobParseResult {
  blocks: readonly LenientParseResult[];
  warnings: readonly string[];
  scriptBlockCount: number;
}

/**
 * Multi-block variant for SEO-team workflows that paste a whole file
 * containing several `<script type="application/ld+json">` tags
 * separated by HTML comments (Webflow / Rank Math / ChatGPT generator
 * outputs). Extracts each block, parses independently, surfaces
 * per-block parse results to the modal picker. Comments outside
 * `<script>` tags never reach the JSON parser.
 *
 * Falls back to single-blob parse when no `<script>` tags are present
 * so the simple paste workflow stays unchanged.
 */
export const parseLenientMulti = (input: string): MultiBlobParseResult => {
  if (typeof input !== 'string' || input.trim().length === 0) {
    return {
      blocks: [{ ok: false, message: 'Input is empty.' }],
      warnings: [],
      scriptBlockCount: 0,
    };
  }

  const matches = Array.from(input.matchAll(SCRIPT_TAG_GLOBAL_RE));
  if (matches.length === 0) {
    return {
      blocks: [parseLenient(input)],
      warnings: [],
      scriptBlockCount: 0,
    };
  }

  const fileWarnings: string[] = [
    `Found ${matches.length} <script type="application/ld+json"> block${matches.length === 1 ? '' : 's'}.`,
  ];

  const blocks: LenientParseResult[] = [];
  for (const match of matches) {
    const raw = (match[1] ?? '').trim();
    if (raw.length === 0) {
      blocks.push({ ok: false, message: 'Empty <script> block.' });
      continue;
    }
    const blockWarnings: string[] = [];
    const normalised = normaliseContextHttps(raw, blockWarnings);
    blocks.push(tryParseOne(normalised, blockWarnings));
  }

  return { blocks, warnings: fileWarnings, scriptBlockCount: matches.length };
};

/**
 * Schema.org `@type` values the dispatcher already emits automatically
 * for a given collection. Pasting one of these creates an `@id`
 * collision or a split entity in Google's knowledge graph — the
 * default ingest action is "skip with explanation" so the SEO team
 * stops dropping them into pastes.
 *
 * Source-of-truth: `apps/cms/src/payload/lib/jsonld/dispatch.ts` — keep
 * in sync when new builders land.
 */
export const AUTO_EMITTED_TYPES_BY_COLLECTION: Readonly<Record<string, ReadonlySet<string>>> = {
  blogs: new Set(['Organization', 'WebSite', 'Article', 'Person', 'BreadcrumbList', 'FAQPage']),
  news: new Set(['Organization', 'WebSite', 'NewsArticle', 'Person', 'BreadcrumbList', 'FAQPage']),
  guides: new Set(['Organization', 'WebSite', 'TechArticle', 'Person', 'BreadcrumbList', 'FAQPage', 'HowTo']),
  knowledgeBase: new Set(['Organization', 'WebSite', 'TechArticle', 'Person', 'BreadcrumbList', 'FAQPage']),
  authors: new Set(['Organization', 'WebSite', 'Person', 'BreadcrumbList']),
  events: new Set(['Organization', 'WebSite', 'Event', 'Person', 'BreadcrumbList']),
  webinars: new Set(['Organization', 'WebSite', 'Event', 'Person', 'BreadcrumbList']),
  jobs: new Set(['Organization', 'WebSite', 'JobPosting', 'BreadcrumbList']),
  pages: new Set(['Organization', 'WebSite', 'WebPage', 'AboutPage', 'ContactPage', 'CollectionPage', 'BreadcrumbList']),
  resources: new Set(['Organization', 'WebSite', 'WebPage', 'DigitalDocument', 'BreadcrumbList']),
};

export type IngestAction = 'merge' | 'skip';
export type IngestReason =
  | 'allowed'
  | 'duplicates-auto-emit'
  | 'off-allowlist'
  | 'collection-restricted'
  | 'off-domain-id'
  | 'nested-id'
  | 'invalid-shape'
  | 'oversize';

export interface IngestPlanItem {
  readonly blob: Record<string, unknown>;
  readonly blobType: string;
  readonly action: IngestAction;
  readonly reason: IngestReason;
  readonly message: string;
  /**
   * `true` when the admin is allowed to flip the default decision
   * (e.g. force-merge a duplicate FAQPage). `false` for hard blocks
   * (off-allowlist, nested-id, oversize, collection-restricted,
   * invalid-shape) — those can never be merged regardless of UI state.
   */
  readonly overridable: boolean;
}

export interface IngestPlan {
  readonly items: readonly IngestPlanItem[];
  readonly siteOrigin: string;
  readonly collectionSlug: string | null;
}

const safeOrigin = (input: string): string | null => {
  try {
    return new URL(input).origin;
  } catch {
    return null;
  }
};

const blobTypeOf = (blob: Record<string, unknown>): string => {
  const raw = blob['@type'];
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw) && typeof raw[0] === 'string') return raw[0];
  return 'Unknown';
};

const hasNestedIdRef = (blob: Record<string, unknown>): boolean => {
  const { '@id': _topId, ...rest } = blob;
  return containsAtId(rest);
};

/**
 * Classify each parsed blob against four buckets (auto-emit duplicate
 * / on-allowlist / collection-restricted / off-allowlist) plus the
 * cross-cutting safety rules (off-domain `@id`, nested `@id`,
 * oversize). The modal picker renders the result with `action` as the
 * checkbox default and `message` as the explanation.
 *
 * Pure function — no I/O, no React, fully unit-testable.
 */
export const buildIngestPlan = (
  blobs: readonly unknown[],
  options: {
    collectionSlug: string | null;
    siteOrigin: string;
  },
): IngestPlan => {
  const collectionSlug = options.collectionSlug;
  const siteOrigin = safeOrigin(options.siteOrigin) ?? options.siteOrigin;
  const autoEmittedTypes: ReadonlySet<string> =
    (collectionSlug ? AUTO_EMITTED_TYPES_BY_COLLECTION[collectionSlug] : undefined) ?? new Set();

  const items: IngestPlanItem[] = [];
  for (const raw of blobs) {
    if (!raw || typeof raw !== 'object') {
      items.push({
        blob: { '@type': 'Unknown' } as Record<string, unknown>,
        blobType: 'Unknown',
        action: 'skip',
        reason: 'invalid-shape',
        message: 'Block is not a JSON object.',
        overridable: false,
      });
      continue;
    }
    const blob = raw as Record<string, unknown>;
    const type = blobTypeOf(blob);

    const size = (() => {
      try {
        return new TextEncoder().encode(JSON.stringify(blob)).length;
      } catch {
        return Number.POSITIVE_INFINITY;
      }
    })();
    if (size > MAX_SERIALIZED_BYTES) {
      items.push({
        blob,
        blobType: type,
        action: 'skip',
        reason: 'oversize',
        message: `Blob is ${size} bytes; exceeds the ${MAX_SERIALIZED_BYTES}-byte cap.`,
        overridable: false,
      });
      continue;
    }

    if (hasNestedIdRef(blob)) {
      items.push({
        blob,
        blobType: type,
        action: 'skip',
        reason: 'nested-id',
        message: 'Nested @id reference detected. Top-level @id is fine; nested @id can pull external graphs into Google\'s understanding of the page.',
        overridable: false,
      });
      continue;
    }

    // Auto-emitted duplicate — checked BEFORE off-allowlist so
    // SEO-team pastes of Organization / WebSite / BreadcrumbList /
    // WebPage get an *informative* message ("we already emit this")
    // instead of a generic "off-allowlist" rejection. Overridable
    // only when the type is also on the user allowlist (e.g. FAQPage
    // on guides — admin may legitimately want a second blob with
    // edge-case Qs). Auto-emitted-but-not-on-allowlist types stay
    // non-overridable because the dispatcher's allowlist check would
    // reject them on save anyway.
    if (autoEmittedTypes.has(type)) {
      const onAllowlist = ALLOWED_TYPE_SET.has(type);
      items.push({
        blob,
        blobType: type,
        action: 'skip',
        reason: 'duplicates-auto-emit',
        message: onAllowlist
          ? `An auto-generated ${type} blob already exists on this page. Merging the pasted version will append a second, possibly diluting the canonical shape.`
          : `${type} is auto-generated by the platform and cannot be overridden — pasting it would split knowledge-graph attribution. Edit the underlying document fields instead.`,
        overridable: onAllowlist,
      });
      continue;
    }

    if (!ALLOWED_TYPE_SET.has(type)) {
      items.push({
        blob,
        blobType: type,
        action: 'skip',
        reason: 'off-allowlist',
        message: `"${type}" is not on the override allowlist.`,
        overridable: false,
      });
      continue;
    }

    if (!isAllowedForCollection(type as AllowedOverrideType, collectionSlug)) {
      const allowed = Array.from(COLLECTION_RESTRICTED_TYPES[type as AllowedOverrideType] ?? new Set());
      items.push({
        blob,
        blobType: type,
        action: 'skip',
        reason: 'collection-restricted',
        message: `"${type}" is allowed only on collections: ${allowed.join(', ') || '(none)'}.`,
        overridable: false,
      });
      continue;
    }

    const topId = blob['@id'];
    if (typeof topId === 'string' && topId.length > 0) {
      const origin = safeOrigin(topId);
      if (origin != null && origin !== siteOrigin) {
        items.push({
          blob,
          blobType: type,
          action: 'skip',
          reason: 'off-domain-id',
          message: `Top-level @id "${topId}" points off-domain (expected ${siteOrigin}). Allowing this will split knowledge-graph attribution between domains.`,
          overridable: true,
        });
        continue;
      }
    }

    items.push({
      blob,
      blobType: type,
      action: 'merge',
      reason: 'allowed',
      message: `Will be appended to the page's JSON-LD graph.`,
      overridable: true,
    });
  }

  return { items, siteOrigin, collectionSlug };
};
