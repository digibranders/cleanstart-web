'use client';

import { useEffect } from 'react';

/**
 * Branded error boundary for the /admin subtree. Next.js renders this when a
 * Server/Client Component below the (payload) layout throws during render.
 * Payload's RootLayout (and its theme classes) still wrap this, so the 3D
 * 500 illustration and tokens below inherit the active light/dark theme.
 *
 * Kept deliberately dependency-free: no @payloadcms/ui render imports (admin
 * owns its render path) and a plain <img> rather than next/image, matching the
 * rest of the admin chrome.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  useEffect(() => {
    // Surface the digest in the console so a support request can quote it;
    // Sentry's global handler still captures the underlying throw.
    console.error('[admin] render error', error);
  }, [error]);

  return (
    <div className="cs-admin-error">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="cs-admin-error__art"
        src="/error/500.webp"
        alt=""
        aria-hidden="true"
        decoding="async"
      />
      <h1 className="cs-admin-error__title">Something went wrong</h1>
      <p className="cs-admin-error__sub">
        An unexpected error occurred while loading this screen. You can try
        again, or head back to the dashboard.
      </p>
      {error.digest ? (
        <p className="cs-admin-error__digest">Reference: {error.digest}</p>
      ) : null}
      <div className="cs-admin-error__actions">
        <button
          type="button"
          className="cs-admin-error__btn cs-admin-error__btn--primary"
          onClick={reset}
        >
          Try again
        </button>
        <a className="cs-admin-error__btn" href="/admin">
          Back to dashboard
        </a>
      </div>
    </div>
  );
}
