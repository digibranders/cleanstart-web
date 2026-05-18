import type {
  CollectionBeforeChangeHook,
  CollectionBeforeValidateHook,
} from 'payload';

export type FirstPublishHookOptions = {
  /**
   * The date field this hook stamps. Defaults to `publishedAt` (the
   * system-managed first-publish timestamp shared across most content
   * collections). News overrides this to `publicationDate` because the
   * News collection treats `publicationDate` as the canonical
   * publish-moment field (it has no separate `publishedAt`).
   */
  field?: string;
};

/**
 * beforeChange hook that stamps a date field whenever a doc is saved
 * in `_status: 'published'` and the field is currently null/empty.
 *
 * Two scenarios it covers:
 *  - **First publish** (`draft → published`): stamps with `now()` so
 *    editors don't have to set it manually.
 *  - **Legacy rows** (`published` before this hook landed, never had
 *    the field written): stamps with the doc's `createdAt` on the
 *    next save so the field self-heals without a migration. Using
 *    `createdAt` (not `now()`) keeps the date faithful — `createdAt`
 *    is at-or-before the actual first-publish moment.
 *
 * Never overwrites an existing value — editor backdates and explicit
 * picker edits are preserved.
 *
 * Required for Schema.org Article / NewsArticle / TechArticle's
 * `datePublished`. The JSON-LD dispatcher reads this field via
 * `readPublishedAt` and emits `datePublished` only when the value is
 * non-null.
 */
export const firstPublishHook = (
  options: FirstPublishHookOptions = {},
): CollectionBeforeChangeHook => {
  const field = options.field ?? 'publishedAt';
  return ({ data, originalDoc, operation }) => {
    if (!data) return data;
    if (operation !== 'create' && operation !== 'update') return data;

    const next = data as Record<string, unknown>;
    const previous = (originalDoc ?? {}) as Record<string, unknown>;

    if (next._status !== 'published') return next;

    const isAlreadySet =
      typeof next[field] === 'string' && (next[field] as string).length > 0;
    const wasAlreadySet =
      typeof previous[field] === 'string' && (previous[field] as string).length > 0;
    if (isAlreadySet || wasAlreadySet) return next;

    const becomingPublished = previous._status !== 'published';
    if (becomingPublished) {
      // First-publish path: stamp with the current moment.
      next[field] = new Date().toISOString();
      return next;
    }

    // Legacy path: doc was already published before this hook existed.
    // Backfill from `createdAt` (always populated by Payload) on the
    // next save. Falls back to `now()` only if `createdAt` is somehow
    // missing — defensive, shouldn't happen in practice.
    const legacySource =
      (typeof previous.createdAt === 'string' && previous.createdAt) ||
      (typeof next.createdAt === 'string' && next.createdAt) ||
      new Date().toISOString();
    next[field] = legacySource;
    return next;
  };
};

/**
 * `beforeValidate` variant of `firstPublishHook`. Identical semantics
 * — but runs **before** field-level validation so an empty
 * editor-facing date field that is `required: true` (e.g. News's
 * `publicationDate`) gets stamped first and validation passes on the
 * publish click. The `beforeChange` flavour stamps too late for
 * required-checks to see the auto-default.
 */
export const firstPublishBeforeValidateHook = (
  options: FirstPublishHookOptions = {},
): CollectionBeforeValidateHook => {
  const inner = firstPublishHook(options);
  return ({ data, originalDoc, operation, req, context, collection }) =>
    // The underlying logic only touches `data`, `originalDoc`, and
    // `operation`; the wider beforeValidate signature is forwarded so
    // the typed surface stays honest.
    inner({ data: data ?? {}, originalDoc, operation, req, context, collection });
};
