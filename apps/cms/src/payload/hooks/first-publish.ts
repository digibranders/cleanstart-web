import type { CollectionBeforeChangeHook } from 'payload';

/**
 * beforeChange hook that stamps `publishedAt` whenever a doc is saved
 * in `_status: 'published'` and the field is currently null/empty.
 *
 * Two scenarios it covers:
 *  - **First publish** (`draft → published`): stamps with `now()` so
 *    editors don't have to set it manually.
 *  - **Legacy rows** (`published` before this hook landed, never had
 *    `publishedAt` written): stamps with the doc's `createdAt` on the
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
export const firstPublishHook = (): CollectionBeforeChangeHook => {
  return ({ data, originalDoc, operation }) => {
    if (!data) return data;
    if (operation !== 'create' && operation !== 'update') return data;

    const next = data as Record<string, unknown>;
    const previous = (originalDoc ?? {}) as Record<string, unknown>;

    if (next._status !== 'published') return next;

    const isAlreadySet =
      typeof next.publishedAt === 'string' && next.publishedAt.length > 0;
    const wasAlreadySet =
      typeof previous.publishedAt === 'string' && previous.publishedAt.length > 0;
    if (isAlreadySet || wasAlreadySet) return next;

    const becomingPublished = previous._status !== 'published';
    if (becomingPublished) {
      // First-publish path: stamp with the current moment.
      next.publishedAt = new Date().toISOString();
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
    next.publishedAt = legacySource;
    return next;
  };
};
