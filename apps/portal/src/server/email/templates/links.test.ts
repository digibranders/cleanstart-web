import { describe, expect, it } from 'vitest';
import { PortalError } from '@/server/errors';
import { buildPasswordReset } from './password-reset';
import { buildTeamInvite } from './team-invite';

const PERSON = { email: 'person@example.com' };
const inviteWith = (inviteUrl: string) =>
  buildTeamInvite({
    to: PERSON,
    inviteeName: null,
    inviterName: 'Aditi Rao',
    audience: 'staff',
    companyName: null,
    roleLabel: 'Marketing',
    inviteUrl,
    expiresOn: '2026-11-19',
  });
const resetWith = (resetUrl: string) => buildPasswordReset({ to: PERSON, name: 'Aditi Rao', resetUrl, expiresInMinutes: 60 });

describe('emails whose whole purpose is the link', () => {
  it.each(['', 'not a url', 'javascript:alert(1)', 'data:text/html,x', '/accept-invite?token=abc'])('refuses an invite link of %j', (url) => {
    expect(() => inviteWith(url)).toThrow(PortalError);
  });

  it.each(['', 'not a url', 'javascript:alert(1)', '/reset-password?token=abc'])('refuses a reset link of %j', (url) => {
    expect(() => resetWith(url)).toThrow(PortalError);
  });

  it('names the template and never the link in the error', () => {
    const secret = 'ftp://host/path?token=SECRET-TOKEN';
    try {
      inviteWith(secret);
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(PortalError);
      expect((error as Error).message).toContain('team-invite');
      expect((error as Error).message).not.toContain('SECRET-TOKEN');
    }
  });

  it('still builds with an https link', () => {
    expect(inviteWith('https://partners.example.com/accept-invite?token=abc').htmlContent).toContain('Accept the invite');
    expect(resetWith('https://partners.example.com/reset-password?token=abc').htmlContent).toContain('Set a new password');
  });
});
