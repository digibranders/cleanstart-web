import { describe, expect, it, vi } from 'vitest';
import { FakeEmailTransport } from '@/server/email/fake';
import { log } from '@/server/log';
import { sendPasswordChangedEmail, sendPasswordResetEmail } from './auth-mail';

describe('sendPasswordResetEmail', () => {
  it('emails the reset link with the token and the lifetime', async () => {
    const transport = new FakeEmailTransport();
    await sendPasswordResetEmail(
      { to: { email: 'aditi@kestrel.example', name: 'Aditi Rao' }, token: 'tok_123', expiresInMinutes: 60 },
      transport,
    );
    const mail = transport.only('aditi@kestrel.example');
    expect(mail.subject).toBe('Reset your CleanStart Partner Portal password');
    expect(mail.htmlContent).toContain('href="http://localhost:3004/reset-password?token=tok_123"');
    expect(mail.htmlContent).toContain('Hello Aditi Rao,');
    expect(mail.htmlContent).toContain('expires in 60 minutes');
  });

  it('escapes a name that carries markup', async () => {
    const transport = new FakeEmailTransport();
    await sendPasswordResetEmail({ to: { email: 'x@example.com', name: '<script>alert(1)</script>' }, token: 't', expiresInMinutes: 60 }, transport);
    expect(transport.only('x@example.com').htmlContent).not.toContain('<script>');
  });
});

describe('a failed send', () => {
  it('does not throw and never logs the reset token', async () => {
    const transport = new FakeEmailTransport();
    transport.failNext = 'brevo 500';
    const logged = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    await expect(
      sendPasswordResetEmail({ to: { email: 'aditi@kestrel.example', name: 'Aditi Rao' }, token: 'tok_secret_value', expiresInMinutes: 60 }, transport),
    ).resolves.toBeUndefined();
    expect(logged).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(logged.mock.calls)).not.toContain('tok_secret_value');
    logged.mockRestore();
  });
});

describe('sendPasswordChangedEmail', () => {
  it('emails the notice with the change time in UTC', async () => {
    const transport = new FakeEmailTransport();
    await sendPasswordChangedEmail(
      { to: { email: 'aditi@kestrel.example', name: 'Aditi Rao' }, changedAt: new Date('2026-11-12T14:02:00Z') },
      transport,
    );
    const mail = transport.only('aditi@kestrel.example');
    expect(mail.subject).toBe('Your CleanStart Partner Portal password was changed');
    expect(mail.htmlContent).toContain('12 Nov 2026, 14:02 UTC');
  });
});
