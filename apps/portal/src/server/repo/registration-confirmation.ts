import type { RegistrationDetailDto } from '@/lib/dto';
import { recordAudit } from '@/server/audit/record';
import type { Viewer } from '@/server/auth/types';
import { ConflictError } from '@/server/errors';
import type { Tx } from './context';
import { defineIsolation } from './isolation.registry';
import { getRegistration } from './registrations';

/**
 * The accepted registration a viewer may print. Visibility is exactly getRegistration's (own company, sales sees only
 * their own deals, staff by region); anything else is NotFoundError. A registration that is not accepted is a ConflictError.
 * A partner download is audited in the same transaction; staff reads are not.
 */
export async function getConfirmationSource(tx: Tx, viewer: Viewer, id: string): Promise<RegistrationDetailDto> {
  const deal = await getRegistration(tx, viewer, id);
  if (deal.status !== 'accepted') {
    throw new ConflictError('not_accepted', 'A confirmation is available once the registration is accepted.');
  }
  if (viewer.kind === 'partner') {
    await recordAudit(tx, viewer, {
      event: 'registration.confirmation_downloaded',
      target: `${deal.customer}, ${deal.reference}`,
      partnerId: deal.partnerId,
      subject: { type: 'registration', id: deal.id },
    });
  }
  return deal;
}

export const isolation = defineIsolation<'getConfirmationSource'>({
  getConfirmationSource: { scope: 'tenant', expect: 'not_found', probe: (tx, viewer, ctx) => getConfirmationSource(tx, viewer, ctx.b.registrationId) },
});
