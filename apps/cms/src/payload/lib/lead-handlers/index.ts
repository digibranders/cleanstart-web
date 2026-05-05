import { brevoHandler } from './brevo';
import { registerSecondaryHandler } from './registry';

// Day-1 secondary chain is Brevo-only. Microsoft Teams (and GA, GSC,
// Slack, HubSpot, etc.) move to a later "Integrations" admin surface
// where editors connect each channel from a CMS settings page, not env
// vars. See docs/BACKLOG.md "Future — Integrations dashboard".

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
};

export { brevoHandler };
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
