import type { Endpoint } from 'payload';
import { z } from 'zod';

import { hasRole } from '../access/typed-user';
import { clientIpFromHeaders } from '../lib/client-ip';
import { checkAndRecord } from '../lib/rate-limit';
import { listSecondaryHandlers } from '../lib/lead-handlers';
import type { LeadHandlerContext, LeadSubmission } from '../lib/lead-handlers/types';

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });

const RETRY_RATE_LIMITS = { perMinute: 5, perDay: 100 };

const paramsSchema = z.object({
  id: z.string().min(1),
});

type SyncStatus = 'synced' | 'failed' | 'skipped' | 'pending';

type SyncEntry = {
  handler: string;
  status: SyncStatus;
  syncedAt?: string | null;
  externalId?: string | null;
  error?: string | null;
  id?: string | null;
};

type LeadDoc = {
  id: number;
  form: number | { id: number };
  formSchemaVersion: number;
  fields: Record<string, unknown>;
  source?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  syncedTo?: SyncEntry[];
};

/**
 * POST /api/leads/:id/retry-sync
 *
 * Re-runs the secondary handler chain for a lead that has at least one
 * `syncedTo` entry with `status: 'failed'`. Updates `syncedTo` in-place.
 * Auth-gated to admin. Rate-limited to 5/min per IP.
 */
export const retryLeadSyncEndpoint: Endpoint = {
  path: '/leads/:id/retry-sync',
  method: 'post',
  handler: async (req) => {
    if (!hasRole(req.user, 'admin')) {
      return json({ ok: false, error: 'forbidden' }, { status: 403 });
    }

    const ip = clientIpFromHeaders(req.headers);
    const rateLimitKey = `retry-lead-sync:${ip}`;
    const limited = checkAndRecord(rateLimitKey, RETRY_RATE_LIMITS);
    if (limited) return json({ ok: false, error: 'rate_limited' }, { status: 429 });

    const paramsResult = paramsSchema.safeParse(req.routeParams);
    if (!paramsResult.success) {
      return json({ ok: false, error: 'missing_id' }, { status: 400 });
    }

    const { id } = paramsResult.data;

    let lead: LeadDoc;
    try {
      lead = (await req.payload.findByID({
        collection: 'leads',
        id,
        overrideAccess: true,
        depth: 0,
      })) as unknown as LeadDoc;
    } catch {
      return json({ ok: false, error: 'not_found' }, { status: 404 });
    }

    const hasFailed = lead.syncedTo?.some((s) => s.status === 'failed') ?? false;
    if (!hasFailed) {
      return json({ ok: false, error: 'no_failed_syncs' }, { status: 400 });
    }

    const formId = typeof lead.form === 'object' ? lead.form.id : lead.form;
    const submission: LeadSubmission = {
      formId,
      formSchemaVersion: lead.formSchemaVersion,
      fields: lead.fields,
      source: lead.source ?? undefined,
      ip: lead.ip ?? undefined,
      userAgent: lead.userAgent ?? undefined,
      consent: undefined,
      utm: undefined,
    };

    const ctx: LeadHandlerContext = {
      payload: req.payload,
      leadId: lead.id,
      primarySucceeded: true,
      duplicateOfLeadId: undefined,
    };

    const handlers = listSecondaryHandlers();
    const results: { handler: string; status: SyncStatus; error?: string }[] = [];

    for (const handler of handlers) {
      const existing = lead.syncedTo?.find((s) => s.handler === handler.name);
      if (existing?.status !== 'failed') continue;

      let status: SyncStatus;
      let error: string | undefined;
      try {
        const result = await handler.run(submission, ctx);
        status = result.status;
        error = result.status === 'failed' ? result.error : undefined;
      } catch (err) {
        status = 'failed';
        error = err instanceof Error ? err.message : String(err);
      }
      results.push({ handler: handler.name, status, ...(error ? { error } : {}) });
    }

    // Merge retry results back onto syncedTo in-place.
    const updatedSyncedTo: SyncEntry[] = (lead.syncedTo ?? []).map((existing) => {
      const retried = results.find((r) => r.handler === existing.handler);
      if (!retried) return existing;
      return {
        handler: existing.handler,
        status: retried.status,
        syncedAt: new Date().toISOString(),
        externalId: existing.externalId ?? null,
        error: retried.error ?? null,
      };
    });

    await req.payload.update({
      collection: 'leads',
      id: lead.id,
      data: { syncedTo: updatedSyncedTo },
      overrideAccess: true,
    });

    const successCount = results.filter((r) => r.status === 'synced').length;
    const failedCount = results.filter((r) => r.status === 'failed').length;

    return json({ ok: true, results, successCount, failedCount });
  },
};
