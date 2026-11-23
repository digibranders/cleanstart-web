'use server';

import { type StaffDealsPageDto, staffDealFiltersSchema } from '@/lib/staff-deals-dto';
import { assertCan } from '@/server/auth/policies';
import { withViewer } from '@/server/repo/context';
import { listStaffDeals } from '@/server/repo/staff-deals';
import type { ActionResult } from './result';
import { runViewerAction } from './run';

export async function listStaffDealsAction(raw: unknown): Promise<ActionResult<StaffDealsPageDto>> {
  return runViewerAction({ name: 'staffDeals.list', schema: staffDealFiltersSchema }, raw, async (ctx, filters) => {
    assertCan(ctx.viewer, 'registration.read_queue');
    return withViewer(ctx.viewer, (tx) => listStaffDeals(tx, ctx.viewer, filters, ctx.clock));
  });
}
