import type { Endpoint } from 'payload';
import { z } from 'zod';

import { hasRole } from '../access/typed-user';
import {
  resolveGenericCredentials,
  resolveTeamsCredentials,
} from '../lib/integrations/credentials';
import { dispatchEvent } from '../lib/webhooks/dispatch';
import type { TeamsMention } from '../lib/webhooks/teams';
import type { WebhookEventName } from '../lib/webhooks/dispatch';

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });

const idParams = z.object({ id: z.string().min(1) });

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
  teamsConfig?: { webhookUrl?: string | null; mentions?: TeamsMention[] | null } | null;
  genericConfig?: {
    url?: string | null;
    signingSecret?: string | null;
    signingKeyId?: string | null;
  } | null;
}

const fixtureEvent = (event: WebhookEventName) =>
  event === 'lead.submitted'
    ? {
        event: 'lead.submitted' as const,
        data: {
          formSlug: '_integration_test',
          duplicate: false,
          source: 'cms' as const,
        },
      }
    : {
        event: 'document.published' as const,
        data: {
          collection: '_integration_test',
          slug: 'integration-test',
          title: 'Integration test',
        },
      };

/**
 * POST /api/integrations/:id/test
 *
 * Synthesises a fixture event matching the row's first subscribed
 * event type, dispatches it to that row only, and returns the
 * HTTP status + latency. Failures don't write to webhooks_dead_letter
 * — test fires are isolated from the production retry queue.
 */
export const integrationsTestEndpoint: Endpoint = {
  path: '/integrations/:id/test',
  method: 'post',
  handler: async (req) => {
    if (!hasRole(req.user, 'admin')) {
      return json({ ok: false, error: 'forbidden' }, { status: 403 });
    }
    const params = idParams.safeParse(req.routeParams);
    if (!params.success) {
      return json({ ok: false, error: 'missing_id' }, { status: 400 });
    }

    let row: IntegrationRow;
    try {
      row = (await req.payload.findByID({
        collection: 'integrations',
        id: params.data.id,
        overrideAccess: true,
        depth: 0,
      })) as unknown as IntegrationRow;
    } catch {
      return json({ ok: false, error: 'not_found' }, { status: 404 });
    }

    const events = row.routing?.events ?? [];
    const firstEvent = events[0];
    if (!firstEvent) {
      return json(
        { ok: false, error: 'row has no subscribed events to test' },
        { status: 400 },
      );
    }

    let destinations: Parameters<typeof dispatchEvent>[1] extends infer T
      ? T extends { destinations?: infer D }
        ? D
        : never
      : never;
    if (row.kind === 'teamsWorkflow') {
      const creds = resolveTeamsCredentials({ teamsConfig: row.teamsConfig ?? null });
      if (!creds) {
        return json({ ok: false, error: 'teamsConfig.webhookUrl missing' }, { status: 400 });
      }
      destinations = [
        {
          id: `test:${row.id}`,
          source: 'db',
          kind: 'teams',
          url: creds.webhookUrl,
          routing: { events: [firstEvent] },
          label: row.label,
          ...(creds.mentions ? { mentions: creds.mentions } : {}),
        },
      ];
    } else if (row.kind === 'genericWebhook') {
      const creds = resolveGenericCredentials({
        id: row.id,
        genericConfig: row.genericConfig ?? null,
      });
      if (!creds) {
        return json(
          { ok: false, error: 'genericConfig.url or signingSecret missing' },
          { status: 400 },
        );
      }
      destinations = [
        {
          id: `test:${row.id}`,
          source: 'db',
          kind: 'generic',
          url: creds.url,
          routing: { events: [firstEvent] },
          signingKeys: [{ id: creds.signingKeyId, secret: creds.signingSecret }],
          label: row.label,
        },
      ];
    } else {
      return json(
        { ok: false, error: `kind "${row.kind}" is not testable from this endpoint` },
        { status: 400 },
      );
    }

    const start = Date.now();
    const [result] = await dispatchEvent(fixtureEvent(firstEvent), {
      destinations,
      // Intentionally no `payload` arg → failures don't persist to dead-letter.
    });
    const latencyMs = Date.now() - start;

    return json({
      ok: result?.ok ?? false,
      status: result?.status ?? 0,
      error: result?.error,
      latencyMs,
      event: firstEvent,
    });
  },
};

/**
 * GET /api/integrations/:id/health
 *
 * Returns a green/yellow/red health badge based on the count of
 * unresolved webhooks_dead_letter entries for this row in the last
 * 24 hours. Updates `integrations.lastHealthAt` so the list view
 * can show "checked X minutes ago".
 *
 * Thresholds: 0 dead-letters = green, 1–2 = yellow, ≥3 = red.
 */
export const integrationsHealthEndpoint: Endpoint = {
  path: '/integrations/:id/health',
  method: 'get',
  handler: async (req) => {
    if (!hasRole(req.user, 'admin')) {
      return json({ ok: false, error: 'forbidden' }, { status: 403 });
    }
    const params = idParams.safeParse(req.routeParams);
    if (!params.success) {
      return json({ ok: false, error: 'missing_id' }, { status: 400 });
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const destinationId = `db:${params.data.id}`;
    const result = await req.payload.find({
      collection: 'webhooks_dead_letter',
      where: {
        and: [
          { destinationId: { equals: destinationId } },
          { createdAt: { greater_than: since } },
          { resolvedAt: { equals: null } },
        ],
      },
      limit: 0,
      depth: 0,
      overrideAccess: true,
    });
    const count = result.totalDocs;
    const badge: 'green' | 'yellow' | 'red' = count >= 3 ? 'red' : count > 0 ? 'yellow' : 'green';

    try {
      await req.payload.update({
        collection: 'integrations',
        id: params.data.id,
        data: { lastHealthAt: new Date().toISOString() },
        overrideAccess: true,
      });
    } catch {
      // Non-fatal — health endpoint shouldn't 500 because of a cache update.
    }

    return json({ ok: true, badge, count, sinceIso: since });
  },
};

interface DeadLetterRow {
  id: number | string;
  webhookId: string;
  event: WebhookEventName;
  attemptCount: number;
  lastError: string | null;
  nextRetryAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

/**
 * GET /api/integrations/:id/audit
 *
 * Last 50 webhooks_dead_letter rows for this destination, sorted by
 * createdAt desc. Used in the drawer to show recent delivery
 * outcomes. Event payloads are deliberately omitted to keep the
 * response small and avoid leaking PII into the admin UI; click-
 * through to webhooks_dead_letter for the full payload.
 */
export const integrationsAuditEndpoint: Endpoint = {
  path: '/integrations/:id/audit',
  method: 'get',
  handler: async (req) => {
    if (!hasRole(req.user, 'admin')) {
      return json({ ok: false, error: 'forbidden' }, { status: 403 });
    }
    const params = idParams.safeParse(req.routeParams);
    if (!params.success) {
      return json({ ok: false, error: 'missing_id' }, { status: 400 });
    }

    const destinationId = `db:${params.data.id}`;
    const result = await req.payload.find({
      collection: 'webhooks_dead_letter',
      where: { destinationId: { equals: destinationId } },
      limit: 50,
      sort: '-createdAt',
      depth: 0,
      overrideAccess: true,
    });
    const rows = (result.docs as unknown as DeadLetterRow[]).map((r) => ({
      id: r.id,
      webhookId: r.webhookId,
      event: r.event,
      attemptCount: r.attemptCount,
      lastError: r.lastError,
      nextRetryAt: r.nextRetryAt,
      resolvedAt: r.resolvedAt,
      createdAt: r.createdAt,
    }));
    return json({ ok: true, rows });
  },
};
