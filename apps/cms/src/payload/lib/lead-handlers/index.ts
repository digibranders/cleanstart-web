import { brevoHandler } from './brevo';
import { companyFromDomainHandler } from './company-from-domain';
import { hubspotHandler } from './hubspot';
import { registerSecondaryHandler } from './registry';

// Secondary chain:
//   - company-from-domain  (free enrichment, no env gate)
//   - brevo                (template-based notification, env-gated)
//   - hubspot              (primary CRM — Phase J3; reads DB-backed
//                           integration row, no env gate)
//
// Slack/Discord/Teams move to a later "Integrations" admin surface
// where editors connect each channel from a CMS settings page, not
// env vars. See docs/BACKLOG.md "Future — Integrations dashboard".

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
  registerSecondaryHandler(brevoHandler);
  registerSecondaryHandler(hubspotHandler);
};

export { brevoHandler, companyFromDomainHandler, hubspotHandler };
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
