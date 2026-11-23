import { describe, expect, it } from 'vitest';
import type { StaffRegion } from '@/lib/domain';
import { ForbiddenError } from '@/server/errors';
import { ACTIONS, type Action, allowedActions, assertCan, can, partnerPermissionTable } from './policies';
import { type PartnerViewer, type RoleKey, roleKey, type StaffViewer, type Viewer } from './types';

/** Column order of the table in the contracts, section D.3. */
const COLUMNS: readonly RoleKey[] = [
  'partner.partner_admin',
  'partner.sales',
  'partner.technical',
  'staff.partner_manager',
  'staff.sales',
  'staff.marketing',
];

type Cell = '-' | 'Y' | 'own' | 'mine' | 'region' | 'self';

/** PA PS PT SM SS SK, copied cell for cell from the permission matrix in the contracts (D.3). */
const MATRIX: Record<Action, string> = {
  'application.read': '- - - Y - -',
  'application.approve': '- - - Y - -',
  'application.decline': '- - - Y - -',
  'application.reopen': '- - - Y - -',
  'partner.read': 'own own own Y region -',
  'partner.create': '- - - Y - -',
  'partner.update_profile': 'own - - Y - -',
  'partner.change_category': '- - - Y - -',
  'partner.change_manager': '- - - Y - -',
  'partner.update_identity': '- - - Y - -',
  'user.reset_two_step': '- - - Y - -',
  'partner.suspend': '- - - Y - -',
  'partner.restore': '- - - Y - -',
  'partner.resend_invites': '- - - Y - -',
  'partner.update_checklist': 'own - - - - -',
  'team.read': 'own - - Y - -',
  'team.invite': 'own - - Y - -',
  'team.resend_invite': 'own - - Y - -',
  'team.revoke_invite': 'own - - Y - -',
  'team.change_role': 'own - - Y - -',
  'team.remove': 'own - - Y - -',
  'team.edit_member': 'own - - Y - -',
  'team.reactivate': 'own - - Y - -',
  'access_request.decide': 'own - - Y - -',
  'staff.read': '- - - Y - -',
  'staff.invite': '- - - Y - -',
  'staff.resend_invite': '- - - Y - -',
  'staff.change_role': '- - - Y - -',
  'staff.change_region': '- - - Y - -',
  'staff.remove': '- - - Y - -',
  'account.update_profile': 'self self self self self self',
  'account.change_password': 'self self self self self self',
  'account.manage_two_factor': 'self self self self self self',
  'account.manage_sessions': 'self self self self self self',
  'account.update_notifications': 'self self self self self self',
  'registration.create': 'own own - Y - -',
  'registration.read': 'own mine - Y region -',
  'registration.read_queue': '- - - Y Y -',
  'registration.resubmit': 'own mine - - - -',
  'registration.decide': '- - - Y region -',
  'registration.undo_decision': '- - - Y region -',
  'registration.reassign': '- - - Y - -',
  'registration.message': 'own mine - Y region -',
  'registration.request_extension': 'own mine - - - -',
  'registration.decide_extension': '- - - Y region -',
  'registration.lookup_customer': 'Y Y - - - -',
  'manager.message': 'Y Y Y - - -',
  'overview.read': 'Y Y - - - -',
  'report.read': '- - - Y Y -',
  'overview.read_staff': '- - - Y Y Y',
  'dashboard.read_staff': '- - - Y Y -',
  'document.read': 'Y Y Y Y Y Y',
  'document.open': 'Y Y Y Y Y Y',
  'document.upload': '- - - Y - Y',
  'document.replace': '- - - Y - Y',
  'document.edit': '- - - Y - Y',
  'document.delete': '- - - Y - Y',
  'document.read_stats': '- - - Y - Y',
  'document.request_material': 'Y Y Y - - -',
  'audit.read': '- - - Y - -',
  'audit.export': '- - - Y - -',
  'search.use': 'Y Y Y Y Y Y',
  'notification.read': 'Y Y Y Y Y Y',
  'integration.read_health': '- - - Y - -',
  'integration.retry_failed': '- - - Y - -',
};

const OWN_PARTNER = 'partner-own';
const OTHER_PARTNER = 'partner-other';

const viewerOf = (key: RoleKey, region: StaffRegion = 'india'): Viewer => {
  const [kind, role] = key.split('.') as ['partner' | 'staff', string];
  const base = { id: `user-${key}`, email: `${role}@example.com`, name: role };
  if (kind === 'partner') {
    return { ...base, kind, role, partnerId: OWN_PARTNER, partnerName: 'Own Partner' } as PartnerViewer;
  }
  return { ...base, kind, role, partnerId: null, partnerName: null, region } as StaffViewer;
};

const cellsOf = (action: Action): Cell[] => MATRIX[action].split(' ') as Cell[];

describe('permission matrix', () => {
  it('has a row for every action and no row for an action that does not exist', () => {
    expect(Object.keys(MATRIX).sort()).toEqual([...ACTIONS].sort());
  });

  it('has one cell per role in every row', () => {
    for (const action of ACTIONS) expect(cellsOf(action), action).toHaveLength(COLUMNS.length);
  });

  describe.each(ACTIONS)('%s', (action) => {
    it.each(COLUMNS.map((key, index) => [key, index] as const))('%s', (key, index) => {
      const cell = cellsOf(action)[index];
      const viewer = viewerOf(key);
      const wideStaff = viewerOf(key, 'all');
      const otherRegionStaff = viewerOf(key, 'middle_east');
      switch (cell) {
        case '-':
          expect(can(viewer, action)).toBe(false);
          expect(can(viewer, action, { partnerId: OWN_PARTNER, region: 'india', ownerUserId: viewer.id, targetUserId: viewer.id })).toBe(false);
          expect(can(wideStaff, action, { region: 'middle_east' })).toBe(false);
          break;
        case 'Y':
          expect(can(viewer, action)).toBe(true);
          if (viewer.kind === 'staff') {
            expect(can(viewer, action, { partnerId: OTHER_PARTNER, region: 'india' })).toBe(true);
            expect(can(viewer, action, { partnerId: OTHER_PARTNER, region: 'middle_east' })).toBe(true);
          } else {
            expect(can(viewer, action, { partnerId: OWN_PARTNER })).toBe(true);
          }
          break;
        case 'own':
          expect(can(viewer, action)).toBe(true);
          expect(can(viewer, action, { partnerId: OWN_PARTNER })).toBe(true);
          expect(can(viewer, action, { partnerId: OTHER_PARTNER })).toBe(false);
          expect(can(viewer, action, { partnerId: null })).toBe(false);
          break;
        case 'mine':
          expect(can(viewer, action)).toBe(true);
          expect(can(viewer, action, { partnerId: OWN_PARTNER, ownerUserId: viewer.id })).toBe(true);
          expect(can(viewer, action, { partnerId: OWN_PARTNER, ownerUserId: 'someone-else' })).toBe(false);
          expect(can(viewer, action, { partnerId: OTHER_PARTNER, ownerUserId: viewer.id })).toBe(false);
          expect(can(viewer, action, { partnerId: OWN_PARTNER, ownerUserId: null })).toBe(false);
          break;
        case 'region':
          expect(can(viewer, action)).toBe(true);
          expect(can(viewer, action, { region: 'india' })).toBe(true);
          expect(can(viewer, action, { region: 'middle_east' })).toBe(false);
          expect(can(viewer, action, { region: null })).toBe(false);
          expect(can(wideStaff, action, { region: 'middle_east' })).toBe(true);
          expect(can(otherRegionStaff, action, { region: 'middle_east' })).toBe(true);
          expect(can(otherRegionStaff, action, { region: 'india' })).toBe(false);
          break;
        case 'self':
          expect(can(viewer, action)).toBe(true);
          expect(can(viewer, action, { targetUserId: viewer.id })).toBe(true);
          expect(can(viewer, action, { targetUserId: 'someone-else' })).toBe(false);
          break;
        default:
          throw new Error(`unknown cell "${String(cell)}" for ${action}`);
      }
    });
  });
});

describe('assertCan', () => {
  it('passes when the role may', () => {
    expect(() => assertCan(viewerOf('staff.partner_manager'), 'registration.decide')).not.toThrow();
  });

  it('throws ForbiddenError with the safe message and an internal message that names role and action', () => {
    try {
      assertCan(viewerOf('partner.sales'), 'application.approve');
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenError);
      expect((error as ForbiddenError).httpStatus).toBe(403);
      expect((error as ForbiddenError).safeMessage).toBe('You do not have access to this.');
      expect((error as ForbiddenError).message).toBe('partner.sales may not application.approve');
    }
  });

  it("refuses another company's record to a partner admin", () => {
    expect(() => assertCan(viewerOf('partner.partner_admin'), 'registration.read', { partnerId: OTHER_PARTNER })).toThrow(ForbiddenError);
  });
});

describe('allowedActions', () => {
  it('lists what a role may attempt with no subject', () => {
    expect(allowedActions(viewerOf('partner.technical'))).toEqual([
      'partner.read',
      'account.update_profile',
      'account.change_password',
      'account.manage_two_factor',
      'account.manage_sessions',
      'account.update_notifications',
      'manager.message',
      'document.read',
      'document.open',
      'document.request_material',
      'search.use',
      'notification.read',
    ]);
  });
});

describe('partnerPermissionTable', () => {
  it('matches what the policies allow for each partner role', () => {
    const table = partnerPermissionTable();
    expect(table.map((row) => [row.label, row.roles.partner_admin, row.roles.sales, row.roles.technical])).toEqual([
      ['Register and track deals', true, true, false],
      ['See the Overview', true, true, false],
      ['Message CleanStart about a deal', true, true, false],
      ['Request a deal extension', true, true, false],
      ['Open documents', true, true, true],
      ['Invite or remove people', true, false, false],
      ['Edit company profile', true, false, false],
    ]);
    const technical = viewerOf('partner.technical');
    expect(can(technical, 'registration.create')).toBe(false);
    expect(can(technical, 'document.open')).toBe(true);
  });
});

describe('role keys', () => {
  it('names a viewer by kind and role', () => {
    expect(roleKey(viewerOf('staff.marketing'))).toBe('staff.marketing');
  });
});
