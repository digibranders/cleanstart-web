'use server';

import { z } from 'zod';
import { assertCan } from '@/server/auth/policies';
import { withViewer } from '@/server/repo/context';
import { markAllRead, markRead } from '@/server/repo/notifications';
import type { ActionResult } from './result';
import { runViewerAction } from './run';

export async function markAllNotificationsReadAction(raw: unknown): Promise<ActionResult<null>> {
  return runViewerAction({ name: 'notification.mark_all_read', schema: z.object({}) }, raw, async (ctx) => {
    assertCan(ctx.viewer, 'notification.read');
    await withViewer(ctx.viewer, (tx) => markAllRead(tx, ctx.viewer, ctx.clock));
    return null;
  });
}

export async function markNotificationReadAction(raw: unknown): Promise<ActionResult<null>> {
  return runViewerAction({ name: 'notification.mark_read', schema: z.object({ id: z.string().uuid() }) }, raw, async (ctx, input) => {
    assertCan(ctx.viewer, 'notification.read');
    await withViewer(ctx.viewer, (tx) => markRead(tx, ctx.viewer, input, ctx.clock));
    return null;
  });
}
