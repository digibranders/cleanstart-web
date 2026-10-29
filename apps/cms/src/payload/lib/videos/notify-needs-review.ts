import type { BasePayload } from 'payload';

import { type WebhookEvent, dispatchEvent } from '../webhooks/dispatch';

const MAX_TITLES = 5;

export const needsReviewListUrl = (serverUrl: string | undefined): string | null =>
  serverUrl
    ? `${serverUrl.replace(/\/+$/, '')}/admin/collections/videos?where[syncState][equals]=needs-review`
    : null;

/**
 * One `video.needs-review` event per sync run. Never throws: a Teams outage must not fail the sync,
 * and `dispatchEvent` already parks failed deliveries in the dead-letter queue for retry.
 */
export const notifyNeedsReview = async ({
  payload,
  count,
  titles,
  skip,
  serverUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL,
  dispatch = dispatchEvent,
}: {
  payload: BasePayload;
  count: number;
  titles: readonly string[];
  /** True in a bulk-script write context (`context.skipPublishWebhooks`). */
  skip: boolean;
  serverUrl?: string | undefined;
  dispatch?: (event: WebhookEvent, options: { logger: BasePayload['logger']; payload: BasePayload }) => Promise<unknown>;
}): Promise<void> => {
  if (count <= 0 || skip) return;
  const adminUrl = needsReviewListUrl(serverUrl);
  try {
    await dispatch(
      {
        event: 'video.needs-review',
        data: { count, titles: titles.slice(0, MAX_TITLES), ...(adminUrl ? { adminUrl } : {}) },
      },
      { logger: payload.logger, payload },
    );
  } catch (error) {
    payload.logger.warn(
      { error: error instanceof Error ? error.message : String(error) },
      'videos sync: needs-review notification failed',
    );
  }
};
