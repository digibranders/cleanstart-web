import type { Clock } from '@/lib/clock';
import { APPLY_STATUS_IP_RULE } from '@/lib/apply';
import type { ApplicationStatusDto } from '@/lib/application-status';
import { publicActor } from '@/server/auth/types';
import { rateLimit } from '@/server/rate-limit';
import { withSystem } from '@/server/repo/context';
import { getApplicationStatus, previewApplicantReply } from '@/server/repo/applications';
import { UNKNOWN_IP_BUCKET } from '@/server/security/client-ip';

/** Used by /apply/status. Throws RateLimitError after 20 lookups per IP in 10 minutes. A wrong token and an expired one are different, calm answers. */
export async function loadApplicationStatus(token: string, ip: string | null, clock: Clock): Promise<ApplicationStatusDto> {
  rateLimit(`apply-status:ip:${ip ?? UNKNOWN_IP_BUCKET}`, APPLY_STATUS_IP_RULE);
  const actor = publicActor('Applicant');
  return withSystem(actor, (tx) => getApplicationStatus(tx, actor, token, clock));
}

/** Used by /apply/reply. Null for any link that cannot be used. Shares the status page's per address limit. */
export async function loadApplicationReply(token: string, ip: string | null, clock: Clock): Promise<{ company: string; question: string } | null> {
  rateLimit(`apply-status:ip:${ip ?? UNKNOWN_IP_BUCKET}`, APPLY_STATUS_IP_RULE);
  const actor = publicActor('Applicant');
  return withSystem(actor, (tx) => previewApplicantReply(tx, actor, token, clock));
}
