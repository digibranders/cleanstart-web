import { log } from '@/server/log';

export interface PasswordResetMail {
  to: { email: string; name: string };
  token: string;
  expiresInMinutes: number;
}

export interface PasswordChangedMail {
  to: { email: string; name: string };
  changedAt: Date;
}

/**
 * Wave 0 bridge. Better Auth calls these two functions; the email module arrives in task M0.5, which replaces
 * both bodies with the real sends. Until then they only log, and never log the token.
 */
export async function sendPasswordResetEmail(input: PasswordResetMail): Promise<void> {
  log.info({ expiresInMinutes: input.expiresInMinutes }, 'password reset requested, email module not wired yet');
}

export async function sendPasswordChangedEmail(input: PasswordChangedMail): Promise<void> {
  log.info({ changedAt: input.changedAt.toISOString() }, 'password changed, email module not wired yet');
}
