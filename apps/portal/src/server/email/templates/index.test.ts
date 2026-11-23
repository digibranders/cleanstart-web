import { describe, expect, it } from 'vitest';
import * as templates from './index';

describe('template index', () => {
  it('exports all 23 builders', () => {
    const builders = Object.keys(templates).filter((key) => key.startsWith('build'));
    expect(builders.sort()).toEqual(
      [
        'buildAccessRequest',
        'buildAccessRequestDeclined',
        'buildApplicationApproved',
        'buildApplicationDeclined',
        'buildApplicationReceived',
        'buildApplicationStaffAlert',
        'buildDealAccepted',
        'buildDealMessage',
        'buildDealRejected',
        'buildDealStageChanged',
        'buildDealSubmittedStaffAlert',
        'buildDocumentMaterialRequest',
        'buildExtensionDecision',
        'buildExtensionRequested',
        'buildManagerMessage',
        'buildNewDocumentNotice',
        'buildPasswordChanged',
        'buildPasswordReset',
        'buildPendingDigest',
        'buildProtectionExpiryReminder',
        'buildRegistrationReceived',
        'buildTeamChangeNotice',
        'buildTeamInvite',
      ].sort(),
    );
  });
});
