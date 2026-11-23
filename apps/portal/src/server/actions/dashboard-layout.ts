'use server';

import { z } from 'zod';
import { DASHBOARD_IDS, type SavedLayout, savedLayoutSchema } from '@/lib/dashboard-layout';
import { assertCan } from '@/server/auth/policies';
import { withViewer } from '@/server/repo/context';
import { saveDashboardLayout } from '@/server/repo/dashboard-layouts';
import type { ActionResult } from './result';
import { runViewerAction } from './run';

const inputSchema = z.object({ dashboard: z.enum(DASHBOARD_IDS), layout: savedLayoutSchema });

/** Saves the signed-in person's arrangement of one dashboard. Nothing is revalidated: the page that changed it already shows the result. */
export async function saveDashboardLayoutAction(raw: unknown): Promise<ActionResult<SavedLayout>> {
  return runViewerAction({ name: 'dashboard.save_layout', schema: inputSchema }, raw, async (ctx, input): Promise<SavedLayout> => {
    assertCan(ctx.viewer, 'dashboard.customize');
    return withViewer(ctx.viewer, (tx) => saveDashboardLayout(tx, ctx.viewer, input.dashboard, input.layout));
  });
}
