import { env } from '@/env';
import type { Clock } from '@/lib/clock';
import { INVITE_IP_RULE } from '@/lib/invites';
import type { InvitePreviewDto } from '@/lib/dto';
import { publicActor } from '@/server/auth/types';
import { rateLimit } from '@/server/rate-limit';
import { UNKNOWN_IP_BUCKET } from '@/server/security/client-ip';
import { withSystem } from '@/server/repo/context';
import { previewInvite } from '@/server/repo/invites';

/** Used by the /accept-invite page and previewInviteAction. Throws RateLimitError after 20 lookups per IP in 10 minutes. */
export async function loadInvitePreview(token: string, ip: string | null, clock: Clock): Promise<InvitePreviewDto> {
  rateLimit(`invite:ip:${ip ?? UNKNOWN_IP_BUCKET}`, INVITE_IP_RULE);
  const actor = publicActor('Invitee');
  const preview = await withSystem(actor, (tx) => previewInvite(tx, actor, token, clock));
  // The agreement version in force is configuration (placeholder 'draft-0' until legal supplies the text).
  return preview.state === 'ok' && preview.needsAgreement ? { ...preview, agreementVersion: env.PARTNER_AGREEMENT_VERSION } : preview;
}
