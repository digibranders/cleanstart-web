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

import type { WebhookEvent, WebhookEventName } from './dispatch';
import { redactWebhookErrorBody } from './redact-error-body';

interface AdaptiveFact {
  readonly title: string;
  readonly value: string;
}

/**
 * Per arch doc §webhooks and INTEGRATIONS-RESEARCH v1 §1.2, Adaptive
 * Cards posted via Teams Workflows resolve `<at>Name</at>` tokens
 * against an `msteams.entities[]` array. Each entry needs the AAD
 * Object ID (GUID) and the UPN — plain `@displayName` strings do not
 * notify. Cross-tenant guests use a UPN of the form
 * `user_fynix.digital#EXT#@cleanstart.onmicrosoft.com`.
 */
export interface TeamsMention {
  readonly displayName: string;
  readonly aadObjectId: string;
  readonly upn: string;
  /** When set, restricts the mention to specific event types. */
  readonly triggerOn?: readonly WebhookEventName[];
}

interface TeamsEntity {
  readonly type: 'mention';
  readonly text: string;
  readonly mentioned: { readonly id: string; readonly name: string };
}

const isMentionEligible = (mention: TeamsMention, event: WebhookEvent): boolean => {
  if (!mention.triggerOn || mention.triggerOn.length === 0) return true;
  return mention.triggerOn.includes(event.event);
};

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

export interface BuildTeamsPayloadOptions {
  readonly mentions?: readonly TeamsMention[];
}

/**
 * Build the JSON payload Teams Workflows expects. Returns the
 * stringified body — callers POST it directly so the dispatch
 * layer can sign / log the same string that hits the wire.
 *
 * When mentions are passed, a leading TextBlock with `<at>Name</at>`
 * tokens is prepended to the card body, and the matching
 * `msteams.entities[]` array is attached so Teams resolves the
 * mentions into pings.
 */
export const buildTeamsPayload = (
  event: WebhookEvent,
  options: BuildTeamsPayloadOptions = {},
): string => {
  const facts = factsFromData(event.data);
  const eligible = (options.mentions ?? []).filter((m) => isMentionEligible(m, event));
  const entities: TeamsEntity[] = eligible.map((m) => ({
    type: 'mention',
    text: `<at>${m.displayName}</at>`,
    mentioned: { id: m.aadObjectId, name: m.upn },
  }));
  const mentionLine =
    entities.length > 0
      ? `Heads up: ${entities.map((e) => e.text).join(' ')}`
      : null;

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
            ...(mentionLine
              ? [{ type: 'TextBlock', wrap: true, text: mentionLine }]
              : []),
            ...(facts.length > 0
              ? [
                  {
                    type: 'FactSet',
                    facts,
                  },
                ]
              : []),
          ],
          ...(entities.length > 0 ? { msteams: { entities } } : {}),
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
  options: { fetch?: typeof fetch; mentions?: readonly TeamsMention[] } = {},
): Promise<TeamsDeliveryResult> => {
  const f = options.fetch ?? globalThis.fetch;
  const body = buildTeamsPayload(event, options.mentions ? { mentions: options.mentions } : {});
  try {
    const res = await f(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, status: res.status, error: redactWebhookErrorBody(text) };
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
