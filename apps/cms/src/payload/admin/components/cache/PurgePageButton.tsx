'use client';

import { useConfig, useDocumentInfo } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useCallback, useState } from 'react';

import { showToast } from '../ToastBus';

interface PurgeResponse {
  ok: boolean;
  purged?: { paths?: string[] };
  disabled?: boolean;
  error?: string;
}

/**
 * Per-document "Purge this page" button (edit sidebar). Manually invalidates the
 * apps/web ISR cache for this doc's detail page + its listing via the same-origin
 * /api/cache-purge endpoint (cookie-authed). The revalidate secret never reaches
 * the browser. Disabled until the doc is saved (no id = no page yet).
 */
export const PurgePageButton = (): ReactElement => {
  const { id, collectionSlug } = useDocumentInfo();
  const { config } = useConfig();
  const serverURL = config?.serverURL ?? '';
  const [running, setRunning] = useState(false);

  const handleClick = useCallback(async () => {
    if (!id || !collectionSlug) return;
    setRunning(true);
    try {
      const res = await fetch(`${serverURL}/api/cache-purge`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ scope: 'page', collection: collectionSlug, id }),
      });
      const body = (await res.json()) as PurgeResponse;
      if (!res.ok || !body.ok) {
        showToast({ message: `Purge failed: ${body.error ?? `HTTP ${res.status}`}`, type: 'error' });
      } else if (body.disabled) {
        showToast({ message: 'Cache purge is disabled in this environment.', type: 'warning' });
      } else {
        const paths = body.purged?.paths ?? [];
        showToast({
          message: paths.length ? `Purged ${paths.join(', ')}` : 'Nothing to purge for this page.',
          type: 'success',
        });
      }
    } catch (err) {
      showToast({ message: err instanceof Error ? err.message : 'Network error', type: 'error' });
    } finally {
      setRunning(false);
    }
  }, [id, collectionSlug, serverURL]);

  if (!id) {
    return (
      <div className="cs-purge-page cs-purge-page--disabled">
        Save first to enable cache purge.
      </div>
    );
  }

  return (
    <div className="cs-purge-page">
      <button
        type="button"
        className="cs-btn cs-btn--subtle"
        disabled={running}
        onClick={handleClick}
      >
        {running ? 'Purging…' : 'Purge this page'}
      </button>
    </div>
  );
};

export default PurgePageButton;
