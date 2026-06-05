import type { CollectionAfterChangeHook, Payload } from 'payload';

import { type CanonicalDoc, docCanonicalUrl } from '../lib/jsonld/url';
import { dispatchEvent } from '../lib/webhooks/dispatch';
import { getRequestId } from '../lib/request-id';
import { resolveSiteUrl } from '../lib/site-url';

const readBaseUrl = async (payload: Payload): Promise<string> => {
  try {
    const settings = (await payload.findGlobal({ slug: 'siteSettings' })) as {
      baseUrl?: string;
    };
    return resolveSiteUrl(settings.baseUrl);
  } catch {
    return resolveSiteUrl();
  }
};

const adminEditUrl = (collection: string, id: unknown): string | null => {
  const base = process.env.PAYLOAD_PUBLIC_SERVER_URL;
  if (!base || id == null) return null;
  return `${base.replace(/\/+$/, '')}/admin/collections/${collection}/${String(id)}`;
};

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
      const baseUrl = await readBaseUrl(req.payload);
      const liveUrl = docCanonicalUrl(baseUrl, collection, typed as CanonicalDoc);
      const editUrl = adminEditUrl(collection, typed.id);

      const publishedAt =
        (typed.publishedAt as string | undefined) ??
        (typed.publicationDate as string | undefined) ??
        (typed.updatedAt as string | undefined);
      const updatedAt = typed.updatedAt as string | undefined;
      // Only surface `updatedAt` when this is a RE-publish of older content
      // — i.e. the doc's update time is meaningfully later than its original
      // publish date. On a first publish the two are within seconds of each
      // other, so we skip it to avoid a redundant "Published / Updated" pair.
      const isRepublishOfOlderContent =
        typeof publishedAt === 'string' &&
        typeof updatedAt === 'string' &&
        new Date(updatedAt).getTime() - new Date(publishedAt).getTime() > 60_000;

      await dispatchEvent(
        {
          event: 'document.published',
          data: {
            collection,
            id: typed.id,
            slug: typed.slug,
            title: (typed.title as string | undefined) ?? (typed.name as string | undefined),
            ...(publishedAt ? { publishedAt } : {}),
            // Re-publish: include the update time so the card can show both
            // the original "Published" date and a distinct "Updated" date.
            ...(isRepublishOfOlderContent && updatedAt ? { updatedAt } : {}),
            // Public live-page URL — rendered as a "View live page" button on
            // the Teams card and surfaced to generic webhook subscribers.
            ...(liveUrl ? { url: liveUrl } : {}),
            // CMS edit-view deep link — "Edit in CMS" button on the card.
            ...(editUrl ? { adminUrl: editUrl } : {}),
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
