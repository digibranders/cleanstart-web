import { NotFoundError, ValidationError } from '@/server/errors';
import type { Viewer } from '@/server/auth/types';

/**
 * Which partner a repo call is about. A partner viewer always means their own company; naming another one is a
 * NotFoundError so ids cannot be probed. Staff must name the partner.
 */
export const resolvePartnerScope = (viewer: Viewer, requested: string | undefined): string => {
  if (viewer.kind === 'partner') {
    if (requested !== undefined && requested !== viewer.partnerId) throw new NotFoundError('partner');
    return viewer.partnerId;
  }
  if (!requested) throw new ValidationError([{ path: 'partnerId', message: 'Choose a partner.' }]);
  return requested;
};
