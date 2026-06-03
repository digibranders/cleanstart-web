import type { CollectionBeforeChangeHook } from 'payload';

/**
 * beforeChange hook that stamps `displayPublishedAt` whenever a doc is
 * saved in `_status: 'published'` and the field is currently empty.
 *
 * Pairs with `firstPublishHook` — must run *after* it in the
 * beforeChange array so `next.publishedAt` is already populated and
 * can be used as the source value.
 *
 *  - **First publish**: `next.publishedAt` was just stamped to `now()`
 *    by `firstPublishHook`. We mirror it so editors who never touched
 *    the picker get a sensible default that matches the system stamp.
 *  - **Legacy rows**: same source preference — `publishedAt` (always
 *    present after the first save) → `createdAt` (defensive fallback).
 *  - **Editor-set values** are preserved — the hook is a no-op when
 *    the field is already non-empty in `next` (the incoming save data).
 *  - **Editor clears the field** — re-stamped to the publish date so
 *    the field is never left permanently empty on a published doc.
 *
 * Read precedence in the JSON-LD dispatcher + byline helpers:
 *   publicationDate > displayPublishedAt > publishedAt > createdAt
 *
 * The field is editor-writable, so backdating works by direct edit;
 * compliance is handled by `displayPublishedAtAuditHook` (afterChange).
 */
export const displayPublishedAtBackfillHook: CollectionBeforeChangeHook = ({
  data,
  originalDoc,
  operation,
}) => {
  if (!data) return data;
  if (operation !== 'create' && operation !== 'update') return data;

  const next = data as Record<string, unknown>;
  const previous = (originalDoc ?? {}) as Record<string, unknown>;

  if (next._status !== 'published') return next;

  const isSet =
    typeof next.displayPublishedAt === 'string' &&
    (next.displayPublishedAt as string).length > 0;
  // Only skip when the incoming data already has the field populated.
  // When the editor clears the field (wasSet but !isSet), we intentionally
  // re-stamp so clearing then republishing produces a sensible date rather
  // than leaving the field permanently empty.
  if (isSet) return next;

  const source =
    (typeof next.publishedAt === 'string' && next.publishedAt) ||
    (typeof previous.publishedAt === 'string' && previous.publishedAt) ||
    (typeof next.createdAt === 'string' && next.createdAt) ||
    (typeof previous.createdAt === 'string' && previous.createdAt) ||
    new Date().toISOString();

  next.displayPublishedAt = source;
  return next;
};
