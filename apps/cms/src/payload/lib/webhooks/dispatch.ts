import { signWebhook, type SignedHeaders, type WebhookSigningKey } from './sign';
import { buildTeamsPayload, postTeamsWebhook } from './teams';

/**
 * Catalog of events the CMS emits. Adding a new event is a code
 * change — keeping it locked here means TypeScript catches typos
 * at the call site.
 */
export type WebhookEventName = 'document.published' | 'lead.submitted';

export interface WebhookEvent {
  readonly event: WebhookEventName;
  readonly data: Record<string, unknown>;
  /** Defaults to `new Date()` at dispatch time. */
  readonly occurredAt?: Date;
}

interface WebhookDestination {
  readonly id: string;
  readonly events: readonly WebhookEventName[];
}

interface TeamsDestination extends WebhookDestination {
  readonly kind: 'teams';
  readonly url: string;
}

interface GenericDestination extends WebhookDestination {
  readonly kind: 'generic';
  readonly url: string;
  readonly signingKeys: readonly WebhookSigningKey[];
}

type AnyDestination = TeamsDestination | GenericDestination;

/**
 * Build the destination list from process.env. Two sources today:
 *
 *   WEBHOOK_TEAMS_URL              — single Teams Workflow URL
 *   WEBHOOK_TEAMS_EVENTS           — comma list, defaults to all
 *
 *   WEBHOOK_GENERIC_URL            — single generic Standard
 *                                    Webhooks subscriber URL
 *   WEBHOOK_GENERIC_EVENTS         — comma list, defaults to all
 *   WEBHOOK_GENERIC_SIGNING_SECRET — shared HMAC secret
 *
 * When neither env block is set, dispatch is a no-op. A richer
 * subscriptions catalog (per-tenant, per-environment) can land as
 * its own collection later — but a two-destination shape covers
 * the launch posture.
 */

const ALL_EVENTS: readonly WebhookEventName[] = ['document.published', 'lead.submitted'];

const parseEvents = (raw: string | undefined): readonly WebhookEventName[] => {
  if (!raw) return ALL_EVENTS;
  const parsed = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is WebhookEventName => s === 'document.published' || s === 'lead.submitted');
  return parsed.length > 0 ? parsed : ALL_EVENTS;
};

export const destinationsFromEnv = (
  env: NodeJS.ProcessEnv = process.env,
): readonly AnyDestination[] => {
  const out: AnyDestination[] = [];
  if (env.WEBHOOK_TEAMS_URL && env.WEBHOOK_TEAMS_URL.length > 0) {
    out.push({
      id: 'teams',
      kind: 'teams',
      url: env.WEBHOOK_TEAMS_URL,
      events: parseEvents(env.WEBHOOK_TEAMS_EVENTS),
    });
  }
  if (
    env.WEBHOOK_GENERIC_URL &&
    env.WEBHOOK_GENERIC_URL.length > 0 &&
    env.WEBHOOK_GENERIC_SIGNING_SECRET &&
    env.WEBHOOK_GENERIC_SIGNING_SECRET.length > 0
  ) {
    out.push({
      id: 'generic',
      kind: 'generic',
      url: env.WEBHOOK_GENERIC_URL,
      events: parseEvents(env.WEBHOOK_GENERIC_EVENTS),
      signingKeys: [{ id: 'env', secret: env.WEBHOOK_GENERIC_SIGNING_SECRET }],
    });
  }
  return out;
};

export interface DispatchResult {
  readonly destinationId: string;
  readonly ok: boolean;
  readonly status: number;
  readonly error?: string;
}

interface DispatchOptions {
  readonly destinations?: readonly AnyDestination[];
  readonly fetch?: typeof fetch;
  readonly logger?: { warn?: (meta: Record<string, unknown>, msg: string) => void };
  readonly now?: Date;
}

const postGeneric = async (
  dest: GenericDestination,
  event: WebhookEvent,
  options: DispatchOptions,
): Promise<DispatchResult> => {
  const f = options.fetch ?? globalThis.fetch;
  const occurredAt = (event.occurredAt ?? options.now ?? new Date()).toISOString();
  const body = JSON.stringify({
    event: event.event,
    data: event.data,
    occurredAt,
  });
  const headers: SignedHeaders = signWebhook(body, dest.signingKeys, {
    timestamp: options.now ?? new Date(),
  });
  try {
    const res = await f(dest.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { destinationId: dest.id, ok: false, status: res.status, error: text };
    }
    return { destinationId: dest.id, ok: true, status: res.status };
  } catch (err) {
    return {
      destinationId: dest.id,
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
};

/**
 * Fan out a single event to every configured destination that
 * subscribes to it. Always resolves — never throws — so a webhook
 * outage cannot block a publish or a lead submission.
 *
 * Failures are logged via the supplied logger (Pino-style).
 * Returns the per-destination outcomes for callers that want to
 * audit individually.
 */
export const dispatchEvent = async (
  event: WebhookEvent,
  options: DispatchOptions = {},
): Promise<readonly DispatchResult[]> => {
  const destinations = options.destinations ?? destinationsFromEnv();
  if (destinations.length === 0) return [];

  const eligible = destinations.filter((d) => d.events.includes(event.event));
  if (eligible.length === 0) return [];

  const results: DispatchResult[] = [];
  for (const dest of eligible) {
    let result: DispatchResult;
    if (dest.kind === 'teams') {
      const r = await postTeamsWebhook(
        dest.url,
        event,
        options.fetch ? { fetch: options.fetch } : {},
      );
      result = { destinationId: dest.id, ok: r.ok, status: r.status, ...(r.error ? { error: r.error } : {}) };
    } else {
      result = await postGeneric(dest, event, options);
    }
    if (!result.ok) {
      options.logger?.warn?.(
        {
          destination: result.destinationId,
          event: event.event,
          status: result.status,
          error: result.error,
        },
        'webhook delivery failed',
      );
    }
    results.push(result);
  }
  return results;
};

export { buildTeamsPayload };
