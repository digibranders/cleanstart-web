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
 * against an `msteams.entities[]` array. The `mentioned.id` (AAD Object
 * ID GUID) is what actually resolves the person and triggers the
 * notification — a plain `@displayName` with no entity does not notify.
 * The `mentioned.name` is the TEXT Teams renders in place of the `<at>`
 * token, so it must be the human display name (NOT the UPN/email, or the
 * card shows the raw email). The UPN is still collected (cross-tenant
 * guests use `user_domain#EXT#@tenant.onmicrosoft.com`) and passed to
 * Workflows that key off it, but it is never the rendered name.
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

// Keys that are surfaced elsewhere on the card or are noise to a human
// reader, so they don't also clutter the key/value FactSet.
//   title         → already the card heading (titleFromEvent)
//   url / adminUrl → rendered as Action.OpenUrl buttons
//   id            → an opaque numeric, meaningless in a chat card
const FACT_EXCLUDE = new Set(['title', 'url', 'adminUrl', 'id']);

// Preferred display order for known facts; unknown keys keep their
// natural (insertion) order after these.
const FACT_ORDER = ['collection', 'slug', 'formSlug', 'source', 'publishedAt', 'updatedAt'];

const FACT_LABELS: Record<string, string> = {
  collection: 'Collection',
  slug: 'Slug',
  title: 'Title',
  publishedAt: 'Published',
  updatedAt: 'Updated',
  formSlug: 'Form',
  formId: 'Form ID',
  source: 'Source',
  duplicate: 'Duplicate',
};

// Keys whose ISO value should render as a human-readable date in the card.
const DATE_FACT_KEYS = new Set(['publishedAt', 'updatedAt']);

const formatFactValue = (key: string, raw: unknown): string => {
  if (DATE_FACT_KEYS.has(key) && typeof raw === 'string' && raw.length > 0) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    }
  }
  return truncateValue(raw);
};

const factsFromData = (data: Record<string, unknown>): AdaptiveFact[] => {
  // Surface up to six top-level fields (excluding heading/button/noise
  // keys), in a stable preferred order, mapping known keys to friendly
  // labels. Keeps the card glanceable.
  const entries = Object.entries(data).filter(([key]) => !FACT_EXCLUDE.has(key));
  const rank = (key: string): number => {
    const i = FACT_ORDER.indexOf(key);
    return i === -1 ? FACT_ORDER.length : i;
  };
  entries.sort(([a], [b]) => rank(a) - rank(b));
  return entries.slice(0, 6).map(([key, value]) => ({
    title: FACT_LABELS[key] ?? key,
    value: formatFactValue(key, value),
  }));
};

interface AdaptiveOpenUrlAction {
  readonly type: 'Action.OpenUrl';
  readonly title: string;
  readonly url: string;
}

const isHttpUrl = (raw: unknown): raw is string =>
  typeof raw === 'string' && /^https?:\/\//i.test(raw);

const actionsFromData = (data: Record<string, unknown>): AdaptiveOpenUrlAction[] => {
  const actions: AdaptiveOpenUrlAction[] = [];
  if (isHttpUrl(data.url)) {
    actions.push({ type: 'Action.OpenUrl', title: 'View live page', url: data.url });
  }
  // `adminUrl` (the CMS edit-view deep link) is intentionally NOT rendered
  // as a card button: it only works for logged-in editors and would send
  // everyone else to a login wall, plus it surfaces an internal URL into a
  // potentially wide channel audience. It stays in the event payload for
  // generic-webhook/automation subscribers that want it.
  return actions;
};

/**
 * The card's primary heading — the human-recognisable name of what
 * happened. For content this is the doc title; for leads it falls back
 * to the submitter email, then the form, then a friendly default. The
 * slug is intentionally NOT appended (it lives in the FactSet and the
 * "View live page" button) so the title reads cleanly at the top.
 */
const titleFromEvent = (event: WebhookEvent): string => {
  const data = event.data as Record<string, unknown>;
  const title = typeof data.title === 'string' && data.title.length > 0 ? data.title : null;
  if (title) return title;
  if (typeof data.email === 'string' && data.email.length > 0) return data.email;
  if (typeof data.formSlug === 'string' && data.formSlug.length > 0) {
    return `New submission · ${data.formSlug}`;
  }
  if (typeof data.slug === 'string' && data.slug.length > 0) return data.slug;
  if (event.event === 'lead.submitted') return 'New form submission';
  return 'New publish';
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
  const actions = actionsFromData(event.data);
  const eligible = (options.mentions ?? []).filter((m) => isMentionEligible(m, event));
  const entities: TeamsEntity[] = eligible.map((m) => ({
    type: 'mention',
    text: `<at>${m.displayName}</at>`,
    // name = the display text Teams renders for the mention; id = the AAD
    // Object ID that resolves the user and fires the ping. Using the UPN
    // as `name` (the old behaviour) made the card show the raw email.
    mentioned: { id: m.aadObjectId, name: m.displayName },
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
            // Content title leads — the human-recognisable headline a
            // reader scans for in a busy channel.
            {
              type: 'TextBlock',
              size: 'Large',
              weight: 'Bolder',
              wrap: true,
              text: titleFromEvent(event),
            },
            // Event type as a small, subtle eyebrow beneath the title —
            // useful for at-a-glance triage without dominating the card.
            {
              type: 'TextBlock',
              spacing: 'None',
              size: 'Small',
              isSubtle: true,
              text: `CleanStart · ${event.event}`,
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
          ...(actions.length > 0 ? { actions } : {}),
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
