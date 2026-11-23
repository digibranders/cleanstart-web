'use server';

import { z } from 'zod';
import { AUDIT_KINDS, AUDIT_WHO } from '@/lib/domain';
import type { AuditEntryDto } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';
import { recordAudit } from '@/server/audit/record';
import { assertCan } from '@/server/auth/policies';
import { exportAudit } from '@/server/repo/audit';
import { withViewer } from '@/server/repo/context';
import { requeueFailedSync } from '@/server/repo/failed-syncs';
import { retryFailedOutbox } from '@/server/repo/integration-health';
import type { ActionResult } from './result';
import { runViewerAction } from './run';

const exportSchema = z.object({
  period: z.enum(['24h', '7d', '30d', '90d', 'custom']),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  event: z.string().max(60).optional(),
  kind: z.enum(AUDIT_KINDS).optional(),
  who: z.enum(AUDIT_WHO).optional(),
  q: z.string().trim().max(100).optional(),
  partnerId: z.string().uuid().optional(),
});

/** The CSV is built in the browser from these rows (src/lib/audit-csv.ts), so the server never formats a file. */
export async function exportAuditAction(raw: unknown): Promise<ActionResult<AuditEntryDto[]>> {
  return runViewerAction({ name: 'audit.export', schema: exportSchema }, raw, async (ctx, input) => {
    assertCan(ctx.viewer, 'audit.export');
    const filter = {
      period: input.period,
      ...(input.from ? { from: input.from } : {}),
      ...(input.to ? { to: input.to } : {}),
      ...(input.event ? { event: input.event } : {}),
      ...(input.kind ? { kind: input.kind } : {}),
      ...(input.who ? { who: input.who } : {}),
      ...(input.q ? { q: input.q } : {}),
      ...(input.partnerId ? { partnerId: input.partnerId } : {}),
    };
    return withViewer(ctx.viewer, (tx) => exportAudit(tx, ctx.viewer, filter, ctx.clock));
  });
}

const retrySchema = z.object({});

/** Sets failed HubSpot sync rows back to pending (health card on the Audit log screen). */
export async function retryFailedOutboxAction(raw: unknown): Promise<ActionResult<{ retried: number }>> {
  return runViewerAction({ name: 'integration.retry_failed', schema: retrySchema }, raw, async (ctx) => {
    assertCan(ctx.viewer, 'integration.retry_failed');
    const retried = await withViewer(ctx.viewer, async (tx) => {
      const count = await retryFailedOutbox(tx, ctx.viewer);
      if (count > 0) {
        await recordAudit(tx, ctx.viewer, {
          event: 'integration.outbox_retried',
          target: `${count} failed HubSpot ${count === 1 ? 'sync' : 'syncs'}`,
        });
      }
      return count;
    });
    ctx.revalidate(ROUTES.admin.audit);
    return { retried };
  });
}

const requeueSchema = z.object({ id: z.string().uuid() });

/** Sets one failed HubSpot sync job back to pending (Failed syncs list on the Audit log screen). */
export async function requeueFailedSyncAction(raw: unknown): Promise<ActionResult<{ requeued: true }>> {
  return runViewerAction({ name: 'integration.requeue_sync', schema: requeueSchema }, raw, async (ctx, input) => {
    assertCan(ctx.viewer, 'integration.retry_failed');
    await withViewer(ctx.viewer, async (tx) => {
      const op = await requeueFailedSync(tx, ctx.viewer, input.id);
      await recordAudit(tx, ctx.viewer, { event: 'integration.sync_requeued', target: op });
    });
    ctx.revalidate(ROUTES.admin.audit);
    return { requeued: true as const };
  });
}
