/**
 * Microsoft Teams Workflows adapter.
 *
 * Per arch doc §webhooks, Teams is the primary destination. Teams
 * Workflows accept inbound webhooks at a URL containing a per-flow
 * token — auth lives in the URL, no HMAC needed (Standard Webhooks
 * signing applies only to *generic* outbound subscriptions where
 * the receiver wants to verify origin).
 *
 * Wire format: a Microsoft Adaptive Card (v1.4) envelope wrapped
 * in an `attachments[]`. We render a minimal three-section card:
 *   - Title with the event name
 *   - Subtitle with the doc / lead headline
 *   - One key/value FactSet for the event payload
 *
 * Note: legacy Office 365 connectors retire 2026-05-18 — Teams
 * Workflows is the supported successor (decision-locked in arch
 * doc §decisions).
 */

import type { WebhookEvent } from './dispatch';

interface AdaptiveFact {
  readonly title: string;
  readonly value: string;
}

const truncateValue = (raw: unknown, max = 240): string => {
  if (raw == null) return '—';
  const s = typeof raw === 'string' ? raw : JSON.stringify(raw);
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
};

const factsFromData = (data: Record<string, unknown>): AdaptiveFact[] => {
  // Surface up to six top-level fields. Flat sample keeps the card
  // glanceable; a future iteration can map per-event-type to a
  // hand-tuned shape.
  const entries = Object.entries(data).slice(0, 6);
  return entries.map(([title, value]) => ({ title, value: truncateValue(value) }));
};

const headlineFromEvent = (event: WebhookEvent): string => {
  const data = event.data as Record<string, unknown>;
  const title = typeof data.title === 'string' && data.title.length > 0 ? data.title : null;
  const slug = typeof data.slug === 'string' && data.slug.length > 0 ? data.slug : null;
  if (title && slug) return `${title} (${slug})`;
  if (title) return title;
  if (slug) return slug;
  if (typeof data.email === 'string') return data.email;
  return '(no headline)';
};

/**
 * Build the JSON payload Teams Workflows expects. Returns the
 * stringified body — callers POST it directly so the dispatch
 * layer can sign / log the same string that hits the wire.
 */
export const buildTeamsPayload = (event: WebhookEvent): string => {
  const facts = factsFromData(event.data);
  const card = {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        contentUrl: null,
        content: {
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          type: 'AdaptiveCard',
          version: '1.4',
          body: [
            {
              type: 'TextBlock',
              size: 'Medium',
              weight: 'Bolder',
              text: `CleanStart · ${event.event}`,
            },
            {
              type: 'TextBlock',
              spacing: 'None',
              isSubtle: true,
              wrap: true,
              text: headlineFromEvent(event),
            },
            ...(facts.length > 0
              ? [
                  {
                    type: 'FactSet',
                    facts,
                  },
                ]
              : []),
          ],
        },
      },
    ],
  };
  return JSON.stringify(card);
};

export interface TeamsDeliveryResult {
  readonly ok: boolean;
  readonly status: number;
  readonly error?: string;
}

/**
 * POST a webhook event to a Teams Workflow URL. Treats any 2xx as
 * success. The caller catches and decides what to do on failure;
 * we don't retry here — that's the dispatch layer's job.
 */
export const postTeamsWebhook = async (
  url: string,
  event: WebhookEvent,
  options: { fetch?: typeof fetch } = {},
): Promise<TeamsDeliveryResult> => {
  const f = options.fetch ?? globalThis.fetch;
  const body = buildTeamsPayload(event);
  try {
    const res = await f(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, status: res.status, error: text };
    }
    return { ok: true, status: res.status };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
};
