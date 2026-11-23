import type { AuditWho, PartnerRole, StaffRole, StaffScope } from '@/lib/domain';

export interface PartnerViewer {
  id: string;
  kind: 'partner';
  role: PartnerRole;
  partnerId: string;
  partnerName: string;
  regions?: undefined;
  email: string;
  name: string;
}

export interface StaffViewer {
  id: string;
  kind: 'staff';
  role: StaffRole;
  partnerId: null;
  partnerName: null;
  /** From staff_scopes and staff_regions: 'all', or the keys of the regions this person covers. */
  regions: StaffScope;
  email: string;
  name: string;
}

export type Viewer = PartnerViewer | StaffViewer;
export type Role = PartnerRole | StaffRole;

/** Identity for code that runs with no signed-in user: jobs, the HubSpot sync, public forms, intake. */
export interface SystemActor {
  kind: 'system';
  /** Shown in the audit log "Who" column and on timeline events. */
  label: string;
  who: AuditWho;
  /** Shown in the audit log role column. */
  roleLabel: string;
}

export type Actor = Viewer | SystemActor;

export const SYSTEM_ACTORS = {
  hubspot: { kind: 'system', label: 'HubSpot sync', who: 'sync', roleLabel: 'Automatic sync' },
  portal: { kind: 'system', label: 'CleanStart', who: 'sync', roleLabel: 'Automatic' },
  intake: { kind: 'system', label: 'Website form', who: 'sync', roleLabel: 'Automatic import' },
} as const satisfies Record<string, SystemActor>;

/** An unauthenticated person acting through a public form (applicant, requester, invitee). */
export const publicActor = (label: string): SystemActor => ({
  kind: 'system',
  label,
  who: 'partner',
  roleLabel: 'Applicant',
});

/** Key used by the permission matrix and its test. */
export type RoleKey =
  | 'partner.partner_admin'
  | 'partner.sales'
  | 'partner.technical'
  | 'staff.partner_manager'
  | 'staff.sales'
  | 'staff.marketing';

export const roleKey = (viewer: Viewer): RoleKey => `${viewer.kind}.${viewer.role}` as RoleKey;
