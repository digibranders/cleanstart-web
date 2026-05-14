import type { ReactElement } from 'react';

/**
 * Wave 5 part 2 — branded post-login chrome injected via
 * `admin.components.afterLogin`. Provides a calm "Need help?" footer
 * + a brand watermark so the auth route doesn't bottom out into
 * empty space below the form. Companion to CmsLoginHero (top of
 * form).
 */
export const CmsLoginFooter = (): ReactElement => {
  return (
    <div className="cs-login-footer">
      <p className="cs-login-footer__line">
        Trouble signing in? Reach the CleanStart admin team in #cms-support.
      </p>
      <p className="cs-login-footer__brand">CleanStart · cms.cleanstart.com</p>
    </div>
  );
};

export default CmsLoginFooter;
