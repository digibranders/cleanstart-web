import { sendEmail } from '@/server/email/send';
import { buildPasswordChanged, buildPasswordReset } from '@/server/email/templates';
import type { EmailTransport } from '@/server/email/transport';
import { resetPasswordUrl } from '@/server/urls';

export interface PasswordResetMail {
  to: { email: string; name: string };
  token: string;
  expiresInMinutes: number;
}

export interface PasswordChangedMail {
  to: { email: string; name: string };
  changedAt: Date;
}

/** What Better Auth calls when someone asks to reset a password. The second argument is for tests. */
export async function sendPasswordResetEmail(input: PasswordResetMail, transport?: EmailTransport): Promise<void> {
  await sendEmail(
    buildPasswordReset({
      to: input.to,
      name: input.to.name,
      resetUrl: resetPasswordUrl(input.token),
      expiresInMinutes: input.expiresInMinutes,
    }),
    transport,
  );
}

/** What Better Auth calls after a password was reset with an emailed link. */
export async function sendPasswordChangedEmail(input: PasswordChangedMail, transport?: EmailTransport): Promise<void> {
  await sendEmail(
    buildPasswordChanged({ to: input.to, name: input.to.name, changedAt: input.changedAt.toISOString() }),
    transport,
  );
}
