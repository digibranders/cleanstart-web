import type { AdminViewServerProps } from 'payload';
import type { ReactElement } from 'react';

import { CmsAccountForm } from './CmsAccountForm';

/**
 * Custom `views.account` — replaces the stock account screen with a
 * CleanStart-branded layout. The actual form (name, email, password
 * change, API keys) is delegated to `CmsAccountForm` which is a
 * client component that consumes Payload's auth hooks.
 *
 * 2FA enrollment lives here once the TOTP backend lands in Phase I —
 * the slot is reserved by `CmsAccountForm` so adding it doesn't
 * require touching this server view again.
 */
export const CmsAccountView = (props: AdminViewServerProps): ReactElement => {
  const user = props.initPageResult?.req?.user;
  const userName =
    (user && typeof user === 'object' && 'name' in user
      ? String((user as unknown as Record<string, unknown>).name ?? '')
      : '') || 'your account';

  return (
    <div className="cs-account">
      <header className="cs-account__header">
        <p className="cs-account__eyebrow">Settings</p>
        <h1 className="cs-account__title">{userName}</h1>
        <p className="cs-account__lede">
          Manage your profile, password, and security preferences.
        </p>
      </header>
      <CmsAccountForm />
    </div>
  );
};

export default CmsAccountView;
