'use server';

import { z } from 'zod';
import type { NotificationCategory } from '@/lib/domain';
import type { ProfileDto } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';
import { recordAudit } from '@/server/audit/record';
import { assertCan } from '@/server/auth/policies';
import { revokeSession } from '@/server/auth/sessions';
import { setNotificationPrefs, updateProfile } from '@/server/repo/account';
import { withViewer } from '@/server/repo/context';
import type { ActionResult } from './result';
import { runViewerAction } from './run';

const profileSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name.').max(120),
  title: z.string().trim().max(120),
  phone: z.string().trim().max(40),
});
const prefsSchema = z.object({
  decision: z.boolean(),
  stage: z.boolean(),
  expiry: z.boolean(),
  docs: z.boolean(),
  team: z.boolean(),
}) satisfies z.ZodType<Record<NotificationCategory, boolean>>;
const sessionSchema = z.object({ sessionId: z.string().uuid() });

export async function updateProfileAction(raw: unknown): Promise<ActionResult<ProfileDto>> {
  return runViewerAction({ name: 'account.update_profile', schema: profileSchema }, raw, async (ctx, input): Promise<ProfileDto> => {
    assertCan(ctx.viewer, 'account.update_profile');
    const profile = await withViewer(ctx.viewer, (tx) =>
      updateProfile(tx, ctx.viewer, { name: input.name, title: input.title || null, phone: input.phone || null }),
    );
    ctx.revalidate(ROUTES.partner.account);
    return profile;
  });
}

export async function setNotificationPrefsAction(raw: unknown): Promise<ActionResult<Record<NotificationCategory, boolean>>> {
  return runViewerAction({ name: 'account.update_notifications', schema: prefsSchema }, raw, async (ctx, input): Promise<Record<NotificationCategory, boolean>> => {
    assertCan(ctx.viewer, 'account.update_notifications');
    const saved = await withViewer(ctx.viewer, (tx) => setNotificationPrefs(tx, ctx.viewer, input));
    ctx.revalidate(ROUTES.partner.account);
    return saved;
  });
}

export async function revokeSessionAction(raw: unknown): Promise<ActionResult<{ sessionId: string }>> {
  return runViewerAction({ name: 'account.revoke_session', schema: sessionSchema }, raw, async (ctx, input): Promise<{ sessionId: string }> => {
    assertCan(ctx.viewer, 'account.manage_sessions');
    // Only the viewer's own sessions: revokeSession takes the viewer id as well as the session id.
    await revokeSession(ctx.viewer.id, input.sessionId);
    await withViewer(ctx.viewer, (tx) =>
      recordAudit(tx, ctx.viewer, {
        event: 'account.session_revoked',
        target: `${ctx.viewer.name}, ${ctx.viewer.email}`,
        partnerId: ctx.viewer.partnerId,
        subject: { type: 'user', id: ctx.viewer.id },
      }),
    );
    ctx.revalidate(ROUTES.partner.account);
    return { sessionId: input.sessionId };
  });
}
