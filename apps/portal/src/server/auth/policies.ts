import { type DealRegion, PARTNER_ROLES, type PartnerRegion, type PartnerRole } from '@/lib/domain';
import { isAllRegions, scopeCovers } from '@/lib/regions';
import { ForbiddenError } from '@/server/errors';
import type { Viewer } from './types';
import { roleKey } from './types';

export const ACTIONS = [
  // Partner applications (master 1.3, 1.4)
  'application.read',
  'application.approve',
  'application.decline',
  'application.reopen',
  // Partners and companies (master 1.4, 1.7, 4.1)
  'partner.read',
  'partner.create',
  'partner.update_profile',
  'partner.update_details',
  'partner.change_category',
  'partner.change_manager',
  'partner.update_identity',
  'partner.suspend',
  'partner.restore',
  'partner.resend_invites',
  'partner.update_checklist',
  // A partner's own people (master 1.5, 1.6)
  'team.read',
  'team.invite',
  'team.resend_invite',
  'team.revoke_invite',
  'team.change_role',
  'team.remove',
  'team.edit_member',
  'team.reactivate',
  'access_request.decide',
  'user.reset_two_step',
  // CleanStart staff (master 1.8)
  'staff.read',
  'staff.invite',
  'staff.resend_invite',
  'staff.change_role',
  'staff.change_region',
  'staff.remove',
  // Sales regions (M3)
  'region.manage',
  // The signed-in person's own account (master 1.7). Always self only.
  'account.update_profile',
  'account.change_password',
  'account.manage_two_factor',
  'account.manage_sessions',
  'account.update_notifications',
  // Deal registrations (master 2.1 to 2.4)
  'registration.create',
  'registration.read',
  'registration.read_queue',
  'registration.resubmit',
  'registration.decide',
  'registration.undo_decision',
  'registration.reassign',
  'registration.message',
  'registration.request_extension',
  'registration.decide_extension',
  'registration.lookup_customer',
  'manager.message',
  // Dashboards (master 2.6)
  'overview.read',
  'report.read',
  'overview.read_staff',
  'dashboard.read_staff',
  // Documents (master 3.1, 3.2)
  'document.read',
  'document.open',
  'document.upload',
  'document.replace',
  'document.edit',
  'document.delete',
  'document.read_stats',
  'document.request_material',
  'document.manage_requests',
  // Cross cutting (master 4.2 to 4.4, HubSpot 4.10)
  'audit.read',
  'audit.export',
  'search.use',
  'notification.read',
  'help.read',
  'integration.read_health',
  'integration.retry_failed',
] as const;

export type Action = (typeof ACTIONS)[number];

/**
 * What an action is about. Every field is optional: an omitted field means "not specified" and the check
 * passes on that dimension (list screens pass no subject; the repo then scopes the rows). A present field
 * is checked. null means "specified and unknown", which fails the check.
 */
export interface PolicySubject {
  /** The partner that owns the record. */
  partnerId?: string | null;
  /** Region of the record (a deal's region, or a partner's region). */
  region?: PartnerRegion | DealRegion | null;
  /** The user who created the record (registrations.registered_by). */
  ownerUserId?: string | null;
  /** The user being acted on (account actions must target the viewer; team actions may not target the viewer's own role). */
  targetUserId?: string | null;
}

type Rule = (viewer: Viewer, subject: PolicySubject | undefined) => boolean;

const ownCompany = (v: Viewer, s: PolicySubject | undefined): boolean =>
  v.kind === 'partner' && (s?.partnerId === undefined || s.partnerId === v.partnerId);

const mine = (v: Viewer, s: PolicySubject | undefined): boolean =>
  v.kind === 'partner' && (s?.ownerUserId === undefined || s.ownerUserId === v.id);

const inScope = (v: Viewer, s: PolicySubject | undefined): boolean =>
  v.kind === 'staff' && (s?.region === undefined || isAllRegions(v.regions) || (s.region !== null && scopeCovers(v.regions, s.region)));

const self = (v: Viewer, s: PolicySubject | undefined): boolean =>
  s?.targetUserId === undefined || s.targetUserId === v.id;

const isPartnerManager = (v: Viewer): boolean => v.kind === 'staff' && v.role === 'partner_manager';
const isStaffSales = (v: Viewer): boolean => v.kind === 'staff' && v.role === 'sales';
const isMarketing = (v: Viewer): boolean => v.kind === 'staff' && v.role === 'marketing';
const isPartnerAdmin = (v: Viewer): boolean => v.kind === 'partner' && v.role === 'partner_admin';
const isPartnerSales = (v: Viewer): boolean => v.kind === 'partner' && v.role === 'sales';

/** Partner admin on own company, or a partner manager on any. */
const teamAdmin: Rule = (v, s) => (isPartnerAdmin(v) && ownCompany(v, s)) || isPartnerManager(v);
/** Partner admin or partner sales on their own company. */
const dealUser: Rule = (v, s) => (isPartnerAdmin(v) || isPartnerSales(v)) && ownCompany(v, s);
/** Partner admin on any own deal; partner sales only on deals they registered. */
const ownDeals: Rule = (v, s) =>
  ownCompany(v, s) && (isPartnerAdmin(v) || (isPartnerSales(v) && mine(v, s)));
const staffDeals: Rule = (v, s) => isPartnerManager(v) || (isStaffSales(v) && inScope(v, s));
const anyone: Rule = () => true;
const managerOnly: Rule = (v) => isPartnerManager(v);

const RULES: Record<Action, Rule> = {
  'application.read': managerOnly,
  'application.approve': managerOnly,
  'application.decline': managerOnly,
  'application.reopen': managerOnly,

  'partner.read': (v, s) => ownCompany(v, s) || isPartnerManager(v) || (isStaffSales(v) && inScope(v, s)),
  'partner.create': managerOnly,
  'partner.update_profile': (v, s) => (isPartnerAdmin(v) && ownCompany(v, s)) || isPartnerManager(v),
  'partner.update_details': (v, s) => (isPartnerAdmin(v) && ownCompany(v, s)) || isPartnerManager(v),
  'partner.change_category': managerOnly,
  'partner.change_manager': managerOnly,
  'partner.update_identity': managerOnly,
  'partner.suspend': managerOnly,
  'partner.restore': managerOnly,
  'partner.resend_invites': managerOnly,
  'partner.update_checklist': (v, s) => isPartnerAdmin(v) && ownCompany(v, s),

  'team.read': teamAdmin,
  'team.invite': teamAdmin,
  'team.resend_invite': teamAdmin,
  'team.revoke_invite': teamAdmin,
  'team.change_role': teamAdmin,
  'team.remove': teamAdmin,
  'team.edit_member': teamAdmin,
  'team.reactivate': teamAdmin,
  'access_request.decide': teamAdmin,
  'user.reset_two_step': managerOnly,

  'staff.read': managerOnly,
  'staff.invite': managerOnly,
  'staff.resend_invite': managerOnly,
  'staff.change_role': managerOnly,
  'staff.change_region': managerOnly,
  'staff.remove': managerOnly,

  'region.manage': managerOnly,

  'account.update_profile': self,
  'account.change_password': self,
  'account.manage_two_factor': self,
  'account.manage_sessions': self,
  'account.update_notifications': self,

  'registration.create': (v, s) => dealUser(v, s) || isPartnerManager(v),
  'registration.read': (v, s) => ownDeals(v, s) || isPartnerManager(v) || (isStaffSales(v) && inScope(v, s)),
  'registration.read_queue': (v) => isPartnerManager(v) || isStaffSales(v),
  'registration.resubmit': ownDeals,
  'registration.decide': staffDeals,
  'registration.undo_decision': staffDeals,
  'registration.reassign': managerOnly,
  'registration.message': (v, s) => ownDeals(v, s) || staffDeals(v, s),
  'registration.request_extension': ownDeals,
  'registration.decide_extension': staffDeals,
  'registration.lookup_customer': dealUser,
  'manager.message': (v) => v.kind === 'partner',

  'overview.read': (v) => isPartnerAdmin(v) || isPartnerSales(v),
  'report.read': (v) => isPartnerManager(v) || isStaffSales(v),
  /** The staff Overview page: every staff role. Marketing gets documents only; the deal figures need dashboard.read_staff. */
  'overview.read_staff': (v) => v.kind === 'staff',
  'dashboard.read_staff': (v) => isPartnerManager(v) || isStaffSales(v),

  'document.read': anyone,
  'document.open': anyone,
  'document.upload': (v) => isPartnerManager(v) || isMarketing(v),
  'document.replace': (v) => isPartnerManager(v) || isMarketing(v),
  'document.edit': (v) => isPartnerManager(v) || isMarketing(v),
  'document.delete': (v) => isPartnerManager(v) || isMarketing(v),
  'document.read_stats': (v) => isPartnerManager(v) || isMarketing(v),
  'document.request_material': (v) => v.kind === 'partner',
  'document.manage_requests': (v) => isPartnerManager(v) || isMarketing(v),

  'audit.read': managerOnly,
  'audit.export': managerOnly,
  'search.use': anyone,
  'notification.read': anyone,
  'help.read': anyone,
  'integration.read_health': managerOnly,
  'integration.retry_failed': managerOnly,
};

/** Pure. Never reads the database. */
export function can(viewer: Viewer, action: Action, subject?: PolicySubject): boolean {
  return RULES[action](viewer, subject);
}

/** Throws ForbiddenError (httpStatus 403, safe message "You do not have access to this.") when can() is false. */
export function assertCan(viewer: Viewer, action: Action, subject?: PolicySubject): void {
  if (!can(viewer, action, subject)) {
    throw new ForbiddenError(`${roleKey(viewer)} may not ${action}`);
  }
}

/** For the permission test: the actions a role may attempt with no subject. */
export const allowedActions = (viewer: Viewer): Action[] => ACTIONS.filter((a) => can(viewer, a));

/** The rows of the Team screen's "What each role can do" table: a label, and the actions that must all be allowed. */
const PARTNER_CAPABILITIES: ReadonlyArray<{ label: string; actions: readonly Action[] }> = [
  { label: 'Register and track deals', actions: ['registration.create', 'registration.read'] },
  { label: 'See the Overview', actions: ['overview.read'] },
  { label: 'Message CleanStart about a deal', actions: ['registration.message'] },
  { label: 'Request a deal extension', actions: ['registration.request_extension'] },
  { label: 'Open documents', actions: ['document.open'] },
  { label: 'Invite or remove people', actions: ['team.invite', 'team.remove'] },
  { label: 'Edit company profile', actions: ['partner.update_profile'] },
];

const probeViewer = (role: PartnerRole): Viewer => ({
  id: 'probe',
  kind: 'partner',
  role,
  partnerId: 'probe',
  partnerName: '',
  email: '',
  name: '',
});

/** Per capability, whether each partner role may do it, read from the policies above so the table cannot drift from them. */
export const partnerPermissionTable = (): Array<{ label: string; roles: Record<PartnerRole, boolean> }> =>
  PARTNER_CAPABILITIES.map(({ label, actions }) => ({
    label,
    roles: Object.fromEntries(PARTNER_ROLES.map((role) => [role, actions.every((a) => can(probeViewer(role), a))])) as Record<PartnerRole, boolean>,
  }));
