import type { CollectionAfterChangeHook } from 'payload';

import { dispatchEvent } from '../lib/webhooks/dispatch';
import { getRequestId } from '../lib/request-id';

/**
 * afterChange hook factory — fires `document.published` when a doc
 * transitions from non-published to published.
 *
 * Transition-only on purpose: re-saves of an already-published
 * doc don't notify (an editor fixing a typo shouldn't blast Teams).
 * If a workflow ever needs republish notifications, that's a
 * separate event name (e.g. document.republished) — same dispatch
 * surface, different gate.
 *
 * Same fail-soft contract as the search-sync hooks: dispatch
 * outage logs but never throws into the surrounding save.
 * Failures are persisted to webhooks_dead_letter for retry.
 */
export const webhooksPublishAfterChangeHook =
  (collection: string): CollectionAfterChangeHook =>
  async ({ doc, previousDoc, req }) => {
    try {
      const previous = (previousDoc as { _status?: string } | undefined)?._status;
      const current = (doc as { _status?: string })._status;
      const wasPublished = previous === 'published';
      const isPublished = current === 'published';
      if (!isPublished || wasPublished) return doc;

      const requestId = getRequestId(req.headers as { get(name: string): string | null });
      const typed = doc as Record<string, unknown>;
      await dispatchEvent(
        {
          event: 'document.published',
          data: {
            collection,
            id: typed.id,
            slug: typed.slug,
            title: (typed.title as string | undefined) ?? (typed.name as string | undefined),
            publishedAt:
              (typed.publishedAt as string | undefined) ??
              (typed.publicationDate as string | undefined) ??
              (typed.updatedAt as string | undefined),
          },
        },
        {
          logger: req.payload.logger,
          payload: req.payload,
          requestId,
        },
      );
    } catch (err) {
      req.payload.logger?.warn?.(
        {
          collection,
          error: err instanceof Error ? err.message : String(err),
        },
        'webhooks.afterChange threw',
      );
    }
    return doc;
  };
