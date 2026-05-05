import { brevoHandler } from './brevo';
import { registerSecondaryHandler } from './registry';
import { teamsHandler } from './teams';

let registered = false;

/**
 * Boot-time hook — registers every secondary handler in one place so
 * the Payload init flow gets a deterministic chain. Idempotent: safe
 * to call from a Payload `onInit` even if the dev server hot-reloads.
 */
export const registerLeadHandlers = (): void => {
  if (registered) return;
  registered = true;
  registerSecondaryHandler(brevoHandler);
  registerSecondaryHandler(teamsHandler);
};

export { brevoHandler, teamsHandler };
export {
  registerSecondaryHandler,
  listSecondaryHandlers,
  submitLead,
} from './registry';
export type { SubmitResult } from './registry';
export { dbPrimaryHandler } from './db-primary';
export type {
  LeadHandler,
  LeadHandlerContext,
  LeadHandlerResult,
  LeadSubmission,
  LeadSubmissionConsent,
  LeadSubmissionUtm,
} from './types';
