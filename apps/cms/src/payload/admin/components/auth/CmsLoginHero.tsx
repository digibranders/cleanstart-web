import type { ReactElement } from 'react';

/**
 * Branded hero injected above the stock LoginForm via
 * `admin.components.beforeLogin`. This is the highest-frequency
 * editor surface (every session starts here) so the copy and chrome
 * sit at the brand level — not a system blue rectangle.
 *
 * Wave 5 part 2 will replace the whole login route with a CleanStart-
 * native form (TOTP-aware, session-expiry-aware). That's contingent
 * on the 2FA backend landing in Phase I.
 */
export const CmsLoginHero = (): ReactElement => {
  return (
    <div className="cs-login-hero">
      <p className="cs-login-hero__eyebrow">CleanStart CMS</p>
      <h1 className="cs-login-hero__title">Welcome back</h1>
      <p className="cs-login-hero__lede">
        Sign in to publish, review drafts, and manage leads.
      </p>
    </div>
  );
};

export default CmsLoginHero;
