import { randomUUID } from 'node:crypto';

import type { BasePayload } from 'payload';

import { decryptJson, isEncrypted } from '../integrations/secrets';
import { routingMatches, type IntegrationRouting } from '../integrations/router';
import { redactWebhookErrorBody } from './redact-error-body';
import { signWebhook, type SignedHeaders, type WebhookSigningKey } from './sign';
import { buildTeamsPayload, postTeamsWebhook, type TeamsMention } from './teams';

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
  readonly source: 'env' | 'db';
  readonly routing: IntegrationRouting;
  readonly label?: string;
}

interface TeamsDestination extends WebhookDestination {
  readonly kind: 'teams';
  readonly url: string;
  readonly mentions?: readonly TeamsMention[];
}

interface GenericDestination extends WebhookDestination {
  readonly kind: 'generic';
  readonly url: string;
  readonly signingKeys: readonly WebhookSigningKey[];
}

type AnyDestination = TeamsDestination | GenericDestination;

const ALL_EVENTS: readonly WebhookEventName[] = ['document.published', 'lead.submitted'];

const parseEvents = (raw: string | undefined): readonly WebhookEventName[] => {
  if (!raw) return ALL_EVENTS;
  const parsed = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is WebhookEventName => s === 'document.published' || s === 'lead.submitted');
  return parsed.length > 0 ? parsed : ALL_EVENTS;
};

/**
 * Build env-driven destinations from process.env. Two destinations are
 * supported as legacy hooks:
 *
 *   WEBHOOK_TEAMS_URL / WEBHOOK_TEAMS_EVENTS
 *   WEBHOOK_GENERIC_URL / WEBHOOK_GENERIC_EVENTS / WEBHOOK_GENERIC_SIGNING_SECRET
 *
 * After J1, these are visible in the L3 list as `source: 'env'` rows.
 * DB rows of the same `kind` take precedence — the env row is suppressed
 * so editors don't double-fire after migrating.
 */
export const destinationsFromEnv = (
  env: NodeJS.ProcessEnv = process.env,
): readonly AnyDestination[] => {
  const out: AnyDestination[] = [];
  if (env.WEBHOOK_TEAMS_URL && env.WEBHOOK_TEAMS_URL.length > 0) {
    out.push({
      id: 'teams',
      source: 'env',
      kind: 'teams',
      url: env.WEBHOOK_TEAMS_URL,
      routing: { events: parseEvents(env.WEBHOOK_TEAMS_EVENTS) },
      label: 'Legacy Teams (env)',
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
      source: 'env',
      kind: 'generic',
      url: env.WEBHOOK_GENERIC_URL,
      routing: { events: parseEvents(env.WEBHOOK_GENERIC_EVENTS) },
      signingKeys: [{ id: 'env', secret: env.WEBHOOK_GENERIC_SIGNING_SECRET }],
      label: 'Legacy generic webhook (env)',
    });
  }
  return out;
};

interface IntegrationRow {
  id: string | number;
  kind: string;
  label: string;
  enabled: boolean;
  source: 'db' | 'env' | null;
  routing?: {
    events?: WebhookEventName[] | null;
    collections?: string[] | null;
    formSlugs?: string[] | null;
  } | null;
  config: unknown;
}

interface TeamsRowConfig {
  readonly webhookUrl?: string;
  readonly mentions?: readonly TeamsMention[];
}

interface GenericRowConfig {
  readonly url?: string;
  readonly signingSecret?: string;
  readonly signingKeyId?: string;
}

const decodeConfig = <T>(raw: unknown): T | null => {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    if (!isEncrypted(raw)) return null;
    try {
      return decryptJson<T>(raw);
    } catch {
      return null;
    }
  }
  if (typeof raw === 'object') return raw as T;
  return null;
};

const rowToDestination = (row: IntegrationRow): AnyDestination | null => {
  const id = `db:${row.id}`;
  const routing: IntegrationRouting = {
    events: row.routing?.events ?? [],
    ...(row.routing?.collections ? { collections: row.routing.collections } : {}),
    ...(row.routing?.formSlugs ? { formSlugs: row.routing.formSlugs } : {}),
  };

  if (row.kind === 'teamsWorkflow') {
    const config = decodeConfig<TeamsRowConfig>(row.config);
    if (!config?.webhookUrl) return null;
    return {
      id,
      source: 'db',
      kind: 'teams',
      url: config.webhookUrl,
      routing,
      label: row.label,
      ...(config.mentions ? { mentions: config.mentions } : {}),
    };
  }

  if (row.kind === 'genericWebhook') {
    const config = decodeConfig<GenericRowConfig>(row.config);
    if (!config?.url || !config.signingSecret) return null;
    return {
      id,
      source: 'db',
      kind: 'generic',
      url: config.url,
      routing,
      signingKeys: [{ id: config.signingKeyId ?? `db-${row.id}`, secret: config.signingSecret }],
      label: row.label,
    };
  }

  // J1 only dispatches teamsWorkflow + genericWebhook. Other kinds
  // (zohoCrm, ga4DataApi, etc.) live in the same collection but are
  // handled by their own pipelines.
  return null;
};

export const destinationsFromPayload = async (
  payload: BasePayload,
): Promise<readonly AnyDestination[]> => {
  try {
    const result = await payload.find({
      collection: 'integrations',
      where: {
        and: [
          { enabled: { equals: true } },
          { source: { equals: 'db' } },
          { kind: { in: ['teamsWorkflow', 'genericWebhook'] } },
        ],
      },
      limit: 200,
      depth: 0,
      overrideAccess: true,
    });
    const rows = (result.docs as unknown as IntegrationRow[]) ?? [];
    return rows
      .map(rowToDestination)
      .filter((d): d is AnyDestination => d !== null);
  } catch {
    // Reading destinations must never throw into a publish/lead flow.
    return [];
  }
};

export const mergeDestinations = (
  dbDestinations: readonly AnyDestination[],
  envDestinations: readonly AnyDestination[],
): readonly AnyDestination[] => {
  // DB rows take precedence per `kind`: when any DB row exists for
  // a kind, the env row for that kind is suppressed so editors don't
  // double-fire after migrating.
  const dbKinds = new Set(dbDestinations.map((d) => d.kind));
  return [...dbDestinations, ...envDestinations.filter((d) => !dbKinds.has(d.kind))];
};

export interface DispatchResult {
  readonly destinationId: string;
  readonly ok: boolean;
  readonly status: number;
  readonly error?: string;
}

/** Retry delay curve in milliseconds: attempt 1→2, 2→3, 3→4, 4→5. */
const RETRY_DELAYS_MS = [
  5 * 60 * 1000,   // 5 min
  15 * 60 * 1000,  // 15 min
  60 * 60 * 1000,  // 1 h
  6 * 60 * 60 * 1000, // 6 h
];

const MAX_ATTEMPTS = 5;

interface DispatchOptions {
  readonly destinations?: readonly AnyDestination[];
  readonly fetch?: typeof fetch;
  readonly logger?: { warn?: (meta: Record<string, unknown>, msg: string) => void };
  readonly now?: Date;
  /** Payload instance — when supplied, failures are persisted to webhooks_dead_letter
   *  AND DB-backed integration rows are loaded and merged with env destinations. */
  readonly payload?: BasePayload;
  readonly requestId?: string;
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
      return {
        destinationId: dest.id,
        ok: false,
        status: res.status,
        error: redactWebhookErrorBody(text),
      };
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
 * Persists a failed delivery to the webhooks_dead_letter collection and
 * schedules the first retry. Errors here are swallowed — a DB write
 * failure must not propagate back into the publish/lead flow.
 */
const recordFailure = async (
  payload: BasePayload,
  dest: AnyDestination,
  event: WebhookEvent,
  result: DispatchResult,
  requestId: string | undefined,
): Promise<void> => {
  try {
    const now = new Date();
    const nextRetryAt = new Date(now.getTime() + (RETRY_DELAYS_MS[0] ?? 5 * 60 * 1000));
    await payload.create({
      collection: 'webhooks_dead_letter',
      data: {
        webhookId: randomUUID(),
        event: event.event,
        eventPayload: { ...event.data } as Record<string, unknown>,
        destinationId: dest.id,
        destinationKind: dest.kind,
        destinationLabel: (dest.label ?? dest.url).slice(0, 80),
        attemptCount: 1,
        lastError: result.error ?? `HTTP ${result.status}`,
        nextRetryAt: nextRetryAt.toISOString(),
        resolvedAt: null,
        ...(requestId ? { requestId } : {}),
      },
      overrideAccess: true,
    });
  } catch {
    // Intentionally swallowed — dead-letter write failure is not fatal.
  }
};

/**
 * Fan out a single event to every configured destination that
 * subscribes to it. Always resolves — never throws — so a webhook
 * outage cannot block a publish or a lead submission.
 *
 * Destination resolution order (when `options.payload` is set):
 *   1. DB-backed `integrations` rows (`enabled = true`, `source = 'db'`)
 *   2. env-driven destinations of *kinds not represented in (1)*
 *
 * Routing predicates (events, collections, formSlugs) filter further.
 * When `options.destinations` is passed, both DB + env loading are
 * skipped — used in tests for deterministic destination lists.
 */
export const dispatchEvent = async (
  event: WebhookEvent,
  options: DispatchOptions = {},
): Promise<readonly DispatchResult[]> => {
  let destinations: readonly AnyDestination[];
  if (options.destinations) {
    destinations = options.destinations;
  } else {
    const envDest = destinationsFromEnv();
    const dbDest = options.payload ? await destinationsFromPayload(options.payload) : [];
    destinations = mergeDestinations(dbDest, envDest);
  }
  if (destinations.length === 0) return [];

  const eligible = destinations.filter((d) => routingMatches(d.routing, event));
  if (eligible.length === 0) return [];

  const results: DispatchResult[] = [];
  for (const dest of eligible) {
    let result: DispatchResult;
    if (dest.kind === 'teams') {
      const r = await postTeamsWebhook(dest.url, event, {
        ...(options.fetch ? { fetch: options.fetch } : {}),
        ...(dest.mentions ? { mentions: dest.mentions } : {}),
      });
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
          requestId: options.requestId,
        },
        'webhook delivery failed — recording for retry',
      );
      if (options.payload) {
        await recordFailure(options.payload, dest, event, result, options.requestId);
      }
    }
    results.push(result);
  }
  return results;
};

export { buildTeamsPayload };
export { RETRY_DELAYS_MS, MAX_ATTEMPTS };
