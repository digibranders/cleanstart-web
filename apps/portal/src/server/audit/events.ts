// src/server/audit/events.ts
import type { AuditKind } from '@/lib/domain';

export const AUDIT_EVENTS = {
  // deal_decisions
  'registration.submitted': { kind: 'deal_decisions', action: 'Registered a deal' },
  'registration.accepted': { kind: 'deal_decisions', action: 'Accepted a registration' },
  'registration.rejected': { kind: 'deal_decisions', action: 'Rejected a registration' },
  'registration.decision_undone': { kind: 'deal_decisions', action: 'Undid a decision' },
  'registration.resubmitted': { kind: 'deal_decisions', action: 'Resubmitted a registration' },
  'registration.extension_requested': { kind: 'deal_decisions', action: 'Requested a protection extension' },
  'registration.extension_granted': { kind: 'deal_decisions', action: 'Granted a protection extension' },
  'registration.extension_declined': { kind: 'deal_decisions', action: 'Declined a protection extension' },
  'registration.stage_changed': { kind: 'deal_decisions', action: 'Stage changed' },
  'registration.protection_end_changed': { kind: 'deal_decisions', action: 'Protection end changed' },
  'registration.expired': { kind: 'deal_decisions', action: 'Registration expired' },
  'integration.outbox_retried': { kind: 'deal_decisions', action: 'Retried failed HubSpot syncs' },
  // partners
  'application.submitted': { kind: 'partners', action: 'Submitted partner application' },
  'application.approved': { kind: 'partners', action: 'Approved an application' },
  'application.declined': { kind: 'partners', action: 'Declined an application' },
  'application.reopened': { kind: 'partners', action: 'Reopened partner application' },
  'partner.created': { kind: 'partners', action: 'Added partner' },
  'partner.manager_changed': { kind: 'partners', action: 'Changed partner manager' },
  'partner.category_changed': { kind: 'partners', action: 'Changed partner category' },
  'partner.suspended': { kind: 'partners', action: 'Suspended partner access' },
  'partner.restored': { kind: 'partners', action: 'Restored partner access' },
  'partner.agreement_accepted': { kind: 'partners', action: 'Accepted the partner agreement' },
  'partner.profile_updated': { kind: 'partners', action: 'Updated company profile' },
  // documents
  'document.uploaded': { kind: 'documents', action: 'Uploaded a document' },
  'document.replaced': { kind: 'documents', action: 'Replaced document file' },
  'document.edited': { kind: 'documents', action: 'Edited a document' },
  'document.audience_changed': { kind: 'documents', action: 'Changed who can open it' },
  'document.deleted': { kind: 'documents', action: 'Deleted a document' },
  // people_access
  'team.invited': { kind: 'people_access', action: 'Invited a user' },
  'team.invite_resent': { kind: 'people_access', action: 'Resent an invite' },
  'team.invite_revoked': { kind: 'people_access', action: 'Withdrew an invite' },
  'team.invite_accepted': { kind: 'people_access', action: 'Accepted an invite' },
  'team.role_changed': { kind: 'people_access', action: 'Changed a role' },
  'team.removed': { kind: 'people_access', action: 'Removed a user' },
  'team.access_requested': { kind: 'people_access', action: 'Asked for access' },
  'team.access_request_approved': { kind: 'people_access', action: 'Approved an access request' },
  'team.access_request_declined': { kind: 'people_access', action: 'Declined an access request' },
  'staff.invited': { kind: 'people_access', action: 'Invited a CleanStart teammate' },
  'staff.invite_resent': { kind: 'people_access', action: 'Resent a CleanStart invite' },
  'staff.role_changed': { kind: 'people_access', action: 'Changed a CleanStart role' },
  'staff.region_changed': { kind: 'people_access', action: 'Changed a CleanStart region' },
  'staff.removed': { kind: 'people_access', action: 'Removed CleanStart access' },
  'account.password_changed': { kind: 'people_access', action: 'Changed a password' },
  'account.two_factor_enabled': { kind: 'people_access', action: 'Turned on two-step sign-in' },
  'account.two_factor_disabled': { kind: 'people_access', action: 'Turned off two-step sign-in' },
  'account.session_revoked': { kind: 'people_access', action: 'Signed out a session' },
} as const satisfies Record<string, { kind: AuditKind; action: string }>;

export type AuditEvent = keyof typeof AUDIT_EVENTS;
export const AUDIT_EVENT_NAMES = Object.keys(AUDIT_EVENTS) as AuditEvent[];
