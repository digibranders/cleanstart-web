import { companyFromDomainHandler } from './company-from-domain';
import { hubspotHandler } from './hubspot';
import { registerSecondaryHandler } from './registry';

// Secondary chain:
//   - company-from-domain  (free enrichment, no env gate)
//   - hubspot              (primary CRM — Phase J3; reads DB-backed
//                           integration row, no env gate)
//
// Email is owned entirely by HubSpot (form follow-up + internal
// notifications). Brevo was removed once HubSpot became the single
// email channel. Slack/Discord/Teams connect from the Integrations
// admin surface, not env vars.

let registered = false;

/**
 * Boot-time hook — registers every secondary handler in one place so
 * the Payload init flow gets a deterministic chain. Idempotent: safe
 * to call from a Payload `onInit` even if the dev server hot-reloads.
 */
export const registerLeadHandlers = (): void => {
  if (registered) return;
  registered = true;
  registerSecondaryHandler(companyFromDomainHandler);
  registerSecondaryHandler(hubspotHandler);
};

export { companyFromDomainHandler, hubspotHandler };
export { hubspotGdprDeleteByEmail } from './hubspot';
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
