import type { Db } from '@/db/client';

export type RegistrationChange =
  | { registrationId: string; kind: 'stage_changed'; stage: string }
  | { registrationId: string; kind: 'protection_end_changed'; protectionEnd: string }
  | { registrationId: string; kind: 'expired' };

/** Called by the HubSpot poll and the expiry job after a change commits. The body arrives with task M2.3; until then it does nothing. */
export async function announceRegistrationChange(_deps: { db: Db }, _change: RegistrationChange): Promise<void> {}
