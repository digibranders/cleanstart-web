import { describe, expect, it } from 'vitest';
import * as templates from './index';

describe('template index', () => {
  it('exports all 32 builders', () => {
    const builders = Object.keys(templates).filter((key) => key.startsWith('build'));
    expect(builders.sort()).toEqual(
      [
        'buildAccessRequest',
        'buildAccessRequestDeclined',
        'buildApplicationApproved',
        'buildChatDigest',
        'buildApplicationDigest',
        'buildAccessRequestCopy',
        'buildApplicationDeclined',
        'buildApplicationInfoRequest',
        'buildApplicationInviteReminder',
        'buildInviteAgainRequest',
        'buildApplicationReceived',
        'buildApplicationStaffAlert',
        'buildDealAccepted',
        'buildDealMessage',
        'buildDealRejected',
        'buildDealStageChanged',
        'buildDealSubmittedStaffAlert',
        'buildDocumentMaterialRequest',
        'buildEmailChangeConfirm',
        'buildEmailChangedNotice',
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
        'buildTwoStepResetNotice',
      ].sort(),
    );
  });
});
