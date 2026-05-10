'use client';

import { useToast } from '@cleanstart/ui';
import { useAuth, useConfig } from '@payloadcms/ui';
import type { ChangeEvent, FormEvent, ReactElement } from 'react';
import { useEffect, useState } from 'react';

type FormState = {
  name: string;
  email: string;
  newPassword: string;
  confirmPassword: string;
};

/**
 * Account form — name, email, password change. Reads the current user
 * from Payload's `useAuth` (data layer only) and PATCHes the users
 * collection on save. 2FA enrollment row is reserved here for Phase I.
 */
export const CmsAccountForm = (): ReactElement => {
  const { user } = useAuth();
  const { config } = useConfig();
  const { push } = useToast();

  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: typeof (user as Record<string, unknown>).name === 'string'
        ? String((user as Record<string, unknown>).name)
        : '',
      email: typeof user.email === 'string' ? user.email : '',
      newPassword: '',
      confirmPassword: '',
    });
  }, [user]);

  const onChange =
    (key: keyof FormState) =>
    (e: ChangeEvent<HTMLInputElement>): void => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const onSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!user) return;
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      push({ message: 'New password and confirmation do not match.', tone: 'error' });
      return;
    }
    setBusy(true);
    try {
      const apiBase = `${config.serverURL ?? ''}${config.routes?.api ?? '/api'}`;
      const body: Record<string, unknown> = {
        name: form.name,
        email: form.email,
      };
      if (form.newPassword) body.password = form.newPassword;
      const res = await fetch(`${apiBase}/users/${user.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const detail = await res.text();
        push({
          title: 'Save failed',
          message: detail || `HTTP ${res.status}`,
          tone: 'error',
        });
        return;
      }
      push({ message: 'Account updated.', tone: 'success' });
      setForm((prev) => ({ ...prev, newPassword: '', confirmPassword: '' }));
    } finally {
      setBusy(false);
    }
  };

  if (!user) return <p>Sign in required.</p>;

  return (
    <form className="cs-account__form" onSubmit={onSubmit}>
      <fieldset className="cs-account__group">
        <legend>Profile</legend>
        <label className="cs-account__field">
          <span>Name</span>
          <input
            type="text"
            className="cs-text-field__input"
            value={form.name}
            onChange={onChange('name')}
            autoComplete="name"
            required
          />
        </label>
        <label className="cs-account__field">
          <span>Email</span>
          <input
            type="email"
            className="cs-text-field__input"
            value={form.email}
            onChange={onChange('email')}
            autoComplete="email"
            required
          />
        </label>
      </fieldset>

      <fieldset className="cs-account__group">
        <legend>Change password</legend>
        <label className="cs-account__field">
          <span>New password</span>
          <input
            type="password"
            className="cs-text-field__input"
            value={form.newPassword}
            onChange={onChange('newPassword')}
            autoComplete="new-password"
            minLength={12}
          />
        </label>
        <label className="cs-account__field">
          <span>Confirm new password</span>
          <input
            type="password"
            className="cs-text-field__input"
            value={form.confirmPassword}
            onChange={onChange('confirmPassword')}
            autoComplete="new-password"
            minLength={12}
          />
        </label>
        <p className="cs-account__hint">
          Leave blank to keep your current password. Minimum 12 characters.
        </p>
      </fieldset>

      <fieldset className="cs-account__group cs-account__group--reserved">
        <legend>Two-factor authentication</legend>
        <p className="cs-account__hint">
          TOTP enrollment will land alongside Phase I hardening. Until then
          admin login is gated by Cloudflare WAF + strong passwords.
        </p>
      </fieldset>

      <div className="cs-account__actions">
        <button type="submit" className="cs-btn cs-btn--primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
};
