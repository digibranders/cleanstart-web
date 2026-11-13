'use server';

import { z } from 'zod';
import { AUDIT_KINDS, AUDIT_WHO } from '@/lib/domain';
import type { AuditEntryDto } from '@/lib/dto';
import { assertCan } from '@/server/auth/policies';
import { exportAudit } from '@/server/repo/audit';
import { withViewer } from '@/server/repo/context';
import type { ActionResult } from './result';
import { runViewerAction } from './run';

const exportSchema = z.object({
  period: z.enum(['7d', '30d', '90d']),
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
      ...(input.kind ? { kind: input.kind } : {}),
      ...(input.who ? { who: input.who } : {}),
      ...(input.q ? { q: input.q } : {}),
      ...(input.partnerId ? { partnerId: input.partnerId } : {}),
    };
    return withViewer(ctx.viewer, (tx) => exportAudit(tx, ctx.viewer, filter, ctx.clock));
  });
}
