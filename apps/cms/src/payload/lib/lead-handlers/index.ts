import { companyFromDomainHandler } from './company-from-domain';
import { confirmationHandler } from './confirmation';
import { hubspotHandler } from './hubspot';
import { registerSecondaryHandler } from './registry';

// Secondary chain:
//   - company-from-domain  (free enrichment, no env gate)
//   - hubspot              (primary CRM — Phase J3; reads DB-backed
//                           integration row, no env gate)
//   - confirmation-email   (visitor acknowledgement over Brevo)
//
// The visitor acknowledgement is ours rather than a HubSpot form follow-up.
// A follow-up is a marketing send gated on subscription status, so anyone
// declining marketing consent would get no acknowledgement of a demo request
// they just made. These are transactional and must not depend on that.
// Internal notification remains HubSpot's. Slack/Discord/Teams connect from
// the Integrations admin surface, not env vars.

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
  registerSecondaryHandler(confirmationHandler);
};

export { companyFromDomainHandler, confirmationHandler, hubspotHandler };
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
