'use server';

import { z } from 'zod';
import { BULK_DECIDE_MAX } from '@/lib/deal-rules';
import { assertCan } from '@/server/auth/policies';
import { withViewer } from '@/server/repo/context';
import { conflictChecks } from '@/server/repo/registrations';
import { acceptRegistrationAction, rejectRegistrationAction } from './decisions';
import type { ActionResult } from './result';
import { runViewerAction } from './run';

const bulkSchema = z
  .object({
    decision: z.enum(['accept', 'reject']),
    ids: z.array(z.string().uuid()).min(1, 'Pick at least one registration.').max(BULK_DECIDE_MAX, `Pick at most ${BULK_DECIDE_MAX} registrations at a time.`),
    reason: z.string().trim().max(500).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.decision === 'reject' && !value.reason) {
      ctx.addIssue({ code: 'custom', path: ['reason'], message: 'Add a reason the partners will see.' });
    }
  });

/** done: decided now. skipped: left waiting on purpose (a conflict). failed: the decision was refused or hit an error. */
export type BulkItemStatus = 'done' | 'skipped' | 'failed';

export interface BulkItemResult {
  id: string;
  status: BulkItemStatus;
  /** Present for skipped and failed. Safe to show. */
  message?: string;
}

export interface BulkDecideResult {
  decision: 'accept' | 'reject';
  items: BulkItemResult[];
}

/**
 * Decides several waiting registrations, each through the single decision action so every one gets its own
 * transaction, audit entry, notification and email. One failure never stops the rest. An accept never overrides a
 * conflict: a registration with a rival is skipped and stays waiting for a person to look at it.
 */
export async function bulkDecideAction(raw: unknown): Promise<ActionResult<BulkDecideResult>> {
  return runViewerAction({ name: 'registration.bulk_decide', schema: bulkSchema }, raw, async (ctx, input) => {
    assertCan(ctx.viewer, 'registration.read_queue');
    const items: BulkItemResult[] = [];
    for (const id of new Set(input.ids)) {
      if (input.decision === 'accept') {
        const check = await withViewer(ctx.viewer, async (tx) => (await conflictChecks(tx, ctx.viewer, { registrationIds: [id] }))[id]);
        if (check?.kind === 'conflict' && check.other) {
          items.push({ id, status: 'skipped', message: `Conflict with ${check.other.partnerName}. Open it and decide it by itself.` });
          continue;
        }
      }
      const result =
        input.decision === 'accept'
          ? await acceptRegistrationAction({ id })
          : await rejectRegistrationAction({ id, reason: input.reason });
      items.push(result.ok ? { id, status: 'done' } : { id, status: 'failed', message: result.error.message });
    }
    return { decision: input.decision, items };
  });
}
